import React, { useState, useEffect } from "react";
import ShowStrategy from "./ShowStrategy";
import CreateStrategy from "./CreateStrategy";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { useForm, FormProvider } from "react-hook-form";
import { CustomForm } from "../../controls/useForm";
import moment from "moment";
import {
  formatJsDateToString,
  productTypeData,
  removeSpaceAndMerge,
  comparerArray,
  andOrTypeData,
  getKeyByValue,
  removeCommas,
  chartTypeData,
  positionTypeData,
  GlobalToast,
  interval,
  filterCompartorData,
  formatJsTimeToString,
  maxTradeTypeData,
} from "../../../utils/common";
import Swal from "sweetalert2";
import { request } from "../../../utils/interceptors";
import { createStrategy } from "../../../apis/strategyapi";
import BackTestResult from "./BackTestResult";

function getScrips(a, b) {
  let c = [];
  var onlyInB = b.filter(comparerArray(a));

  let runtill = a.length > b.length ? a.length : b.length;
  for (let i = 0; i < runtill; i++) {
    let v1 = b.find((val) => val.scrip_id === a[i]?.scrip_id);
    if (v1) {
      c.push(a[i]);
    }
  }
  c.push(...onlyInB);

  return c;
}

function prepareObject(obj, ind_arr, buyOrSell, pattern, options, iscopy) {
  obj.forEach((val, index) => {
    var ciName =
      options.find((new_val) => new_val.label === val.compareIndicator)?.name ||
      pattern.name;
    try {
      ind_arr.push({
        andor: index === 0 ? "and" : removeSpaceAndMerge(val?.andOrValue),
        is_buy: buyOrSell,
        is_not: false,
        ...(val.id && iscopy ? { id: val.id } : undefined),
        ...(val.comparator
          ? { comparator: removeSpaceAndMerge(val.comparator) }
          : undefined),
        comparatorItem: val.comparatorItem ? val.comparatorItem : "",
        compareIndicator: val?.compareIndicatorName
          ? val.compareIndicatorName
          : ciName,
        compareIndicatorDetails:
          JSON.stringify(val?.compareIndicatorDetails) || JSON.stringify({}),
        compareIndicatorItem: val?.compareIndicatorItem || pattern.id,
        indicatorDetails:
          JSON.stringify(val?.indicatorDetails) || JSON.stringify({}),
        indicator_name:
          val.new_name ||
          options.find(
            (new_val) =>
              new_val.label === val.indicatorValue ||
              new_val.name === val.indicatorValue
          ).name,
        indicatorItem: val.indicatorItem || pattern.id,
        comparatorDetails:
          JSON.stringify(val?.comparatorDetails) || JSON.stringify({}),
      });
    } catch (err) {
      console.log(err);
    }
  });
  return ind_arr;
}

const NewStrategyWrapper = (props) => {
  const { newStrategy } = props;

  const [buyData, setBuyData] = useState([]);
  const [sellData, setSellData] = useState([]);
  const [exitEntryData, setExitEntryData] = useState(null);
  const [symbolFormData, setSymbolFormData] = useState(null);
  const [activeStep, setActiveStep] = React.useState(0);

  const [strategyData, setStrategyData] = useState({});
  const [backtestResult, setBackTestResult] = useState([]);

  const [buttonState, setButtonState] = useState(false);
  const [isCopyRun, setIsCopyRun] = useState(false);

  const [isEdit, setIsEdit] = useState(false);

  const [brickSize, setBrickSize] = useState(0);

  const methods = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const is_astra = props.history?.location?.state?.is_astra;
  const is_copy = props.history?.location?.state?.is_copy;

  useEffect(() => {
    let sId = props.match.params?.strategyId;
    if (sId) {
      let requrl = is_astra
        ? `/api/strategy/v2/public/${sId}`
        : `/api/strategy/v2/${sId}/`;
      request(`${requrl}`)
        .then((resp) => {
          var response = Object.assign({}, resp);
          
          const indicator_default = newStrategy.buy;
          let filledInterval =
            response.data["candle_interval"] +
            " " +
            response.data["candle_interval_unit"];

          let filledIntervalValue = interval.find(
            (val) => val.tDisplay === filledInterval
          );
            
          response.data["intervalValue"] = filledIntervalValue.title;
          console.log("charttype",response.data['chart_type'])
          response.data["chart_type"] =
            chartTypeData[response.data["chart_type"]];
            console.log("charttype",response.data['chart_type'])
          response.data["position_type"] =
            positionTypeData[response.data["position_type"]];
          response.data["start_time"] = new Date(
            "1970-01-01T" + response.data["start_time"]
          );
          response.data["end_time"] = new Date(
            "1970-01-01T" + response.data["end_time"]
          );
          response.data["entry_end_time"] = new Date(
            "1970-01-01T" + response.data["entry_end_time"]
          );
          response.data["max_trade_per_day"] =
            maxTradeTypeData[response.data["max_trade_per_day"]];

          request(`api/backtest/v2/getValues/${sId}/`)
            .then((res1) => {
              response.data["startDate"] = new Date(res1.data.start_date);
              response.data["endDate"] = new Date(res1.data.end_date);
              response.data["amount"] = res1.data.initial_amount;
              response.data["product_type"] = getKeyByValue(
                productTypeData,
                parseInt(response.data["product_type"])
              );
              response.data["scrips"] = response.data["scrips"].map(
                ({ scrip_id, scrip_name, ...val }) => ({
                  value: scrip_id,
                  label: scrip_name,
                  ...val,
                })
              );
            })
            .catch((err) => console.log(err));
          const comparator_default = newStrategy.rightIndicator;
          let indicator = response.data.strategy_ind;
          let buyIndi = [];
          let sellIndi = [];
          let b_logic = response.data["buy_logic"]
            .split(" and")
            .join(", ")
            .split(" or")
            .join(", ")
            .split(", ");
          let s_logic = response.data["sell_logic"]
            .split(" and")
            .join(", ")
            .split(" or")
            .join(", ")
            .split(", ");
          let b_index = 0;
          let s_index = 0;

          indicator.forEach((val) => {
            let c_value = comparator_default.find(
              (new_val) => new_val.id === val.comparatorItem
            );
            val["comparator"] = c_value?.title || "";
            let i_name = indicator_default.find(
              (new_val) => new_val.name === val.indicator_name
            );
            let c_name = indicator_default.find(
              (new_val) => new_val.name === val.compareIndicator
            );
            val["compareIndicator"] = c_name?.label
              ? c_name.label
              : val.compareIndicator;
            val["indicator_name"] = i_name?.label
              ? i_name.label
              : val.indicator_name;
            val["indicatorValue"] = i_name?.label
              ? i_name.label
              : val.indicator_name;
            val["my_label"] = {
              label: val.is_buy
                ? filterCompartorData(b_logic[b_index].trim())
                : filterCompartorData(s_logic[s_index].trim()),
            };
            val["compareIndicatorDetails"] = JSON.parse(
              val["compareIndicatorDetails"]
            );
            val["indicatorDetails"] = JSON.parse(val["indicatorDetails"]);
            val["comparatorDetails"] = JSON.parse(val["comparatorDetails"]);
            val["andOrValue"] = andOrTypeData[val["andor"]];

            if (val.is_buy) {
              buyIndi.push(val);
              b_index = b_index + 1;
            } else {
              sellIndi.push(val);
              s_index = s_index + 1;
            }
          }); // end of indicator loop
          setBuyData(buyIndi);
          setSellData(sellIndi);
          methods.reset({
            strategy_name:
              is_copy && !isCopyRun ? "" : response.data.strategy_name,
            intervalValue: response.data.intervalValue,
            chart_type: response.data.chart_type,
            position_type: response.data.position_type,
            take_profit: response.data.take_profit,
            stop_loss: response.data.stop_loss,
            buyIndicator: buyIndi,
            sellIndicator: sellIndi,
            trailing_sl_perc:
              response.data.trailing_sl_perc !== "0.00" ? true : false,
          });
          
          setSymbolFormData(response.data);
          // Creating deep copy of object
          var new_response = Object.assign({}, response.data);
          setStrategyData(new_response);
        })

        .catch((error) => {
          if (error.response) {
            console.log("EEROR IRS ", error.response);
          }
        });
    } // if strategy id present then
  }, []);

  const validateDate = (sDate, eDate, intervalValue) => {
    sDate = moment(sDate);
    eDate = moment(eDate);
    let diff = Math.ceil(eDate.diff(sDate, "months", true));
    if (Math.ceil(eDate.diff(sDate, "days", true)) < 0) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Start Date cannot be greater than End Date",
      });
      return false;
    }
    if (intervalValue === "Minutes" && diff > 3) {
      //toast.error('Difference between Start Date and End Date should not be greater than 3 months')
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Difference between Start Date and End Date should not be greater than 3 months",
      });
      return false;
    } else if (intervalValue === "Hours" && diff > 6) {
      //toast.error('Difference between Start Date and End Date should not be greater than 6 months')
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Difference between Start Date and End Date should not be greater than 6 months",
      });
      return false;
    } else if (intervalValue === "Day" && diff > 12) {
      //toast.error('Difference between Start Date and End Date should not be greater than 12 months')
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Difference between Start Date and End Date should not be greater than 12 months",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => {
      prevActiveStep = prevActiveStep + 1;
      if (prevActiveStep === 2) {
        console.log("HANDLE NEXT ", prevActiveStep);
      }
      return prevActiveStep;
    });
  };

  const onSubmit = (data) => {
    if (activeStep === 1) {
      setSymbolFormData(data);
      if (Object.values(methods.errors).length) {
        return;
      }
      const candle_interval_type = interval.find(
        (val) => val.title === exitEntryData.intervalValue
      );
      const candle_interval = candle_interval_type.value;
      const candle_interval_unit = candle_interval_type.display;
      const startDate = formatJsDateToString(data["startDate"]);
      const endDate = formatJsDateToString(data["endDate"]);

      data["start_time"] = formatJsTimeToString(data["start_time"]);
      data["end_time"] = formatJsTimeToString(data["end_time"]);
      data["entry_end_time"] = formatJsTimeToString(data["entry_end_time"]);

      let result = validateDate(startDate, endDate, candle_interval_unit);
      if (result) {
        var new_data = Object.assign({}, data);

        // //Cleaning and preparing data
        delete new_data["startDate"];
        delete new_data["endDate"];
        var newObject1 = JSON.parse(JSON.stringify(data["scrips"]));
        const sc = newObject1.map((val) => ({
          scrip_id: val.value,
          scrip_name: val.label || val.symbol,
          exchange: val.exchange,
        }));
        new_data["scrips"] = strategyData.strategy_id
          ? getScrips(strategyData.scrips, sc)
          : sc;

        new_data["candle_interval_unit"] = candle_interval_unit;
        new_data["candle_interval"] = parseInt(candle_interval);
        new_data["order_type"] = 1;
        new_data["trailing_sl_perc"] =
          exitEntryData["trailing_sl_perc"] === true ? 1 : 0;
        new_data["description"] = "Testing";
        new_data["take_profit"] = exitEntryData["take_profit"];
        new_data["stop_loss"] = exitEntryData["stop_loss"];
        new_data["chart_type"] = getKeyByValue(
          chartTypeData,
          exitEntryData["chart_type"]
        );
        new_data["position_type"] = removeSpaceAndMerge(
          exitEntryData["position_type"]
        );
        new_data["product_type"] = productTypeData[data["product_type"]];
        new_data["max_trade_per_day"] =
          maxTradeTypeData[data["max_trade_per_day"]];
        new_data["brick_size"] = brickSize;

        let ind_item = [];
        const pattern = newStrategy.setIndicator.find(
          (val) => val.field.name === "Pattern"
        );
        ind_item = prepareObject(
          buyData,
          ind_item,
          true,
          pattern,
          newStrategy.buy,
          is_copy && isCopyRun === false
        );
        ind_item = prepareObject(
          sellData,
          ind_item,
          false,
          pattern,
          newStrategy.buy,
          is_copy && isCopyRun === false
        );
        new_data["strategy_ind"] = ind_item;

        let dateAndAmount = {
          start_date: startDate,
          end_date: endDate,
          startcash: removeCommas(new_data["amount"]),
        };
        if (Object.keys(new_data["scrips"]).length === 0) {
          methods.setError("scrips", {
            type: "required",
            message: "This field is required",
          });

          return;
        }

        let saveStrategyUrlAndMethod =
          is_copy && !isCopyRun
            ? ["api/strategy/v2/", "POST"]
            : strategyData.strategy_id
            ? [`api/strategy/v2/${strategyData.strategy_id}/`, "PUT"]
            : ["api/strategy/v2/", "POST"];

        let strategy_success_msg =
          is_copy && !isCopyRun
            ? "Strategy copied successfully"
            : strategyData.strategy_id
            ? "Strategy edited successfully"
            : "Strategy created successfully";
        // This is call for create strategy or edit strategy
        createStrategy(...saveStrategyUrlAndMethod, new_data)
          .then((res) => {
            GlobalToast.fire({
              icon: "success",
              text: strategy_success_msg,
            });
            if (is_copy && isCopyRun === false) {
              setIsCopyRun(true);
            }
            setIsEdit(true);
            setStrategyData(res.data);
            // This part take care of calling backtest for strategy one by one
            let my_scrips = new_data["scrips"].map((val) => ({
              ...val,
              loading: true,
            }));
            setBackTestResult(my_scrips);
            setButtonState(true);
            my_scrips.forEach((data) => {
              request(
                `api/backtest/v2/run/${res.data.strategy_id}/${data.scrip_id}/`,
                "POST",
                dateAndAmount
              )
                .then((res) => {
                  const scripBacktestIndex = my_scrips.findIndex((p) => {
                    return p.scrip_id === data.scrip_id;
                  });
                  const items = [...my_scrips];
                  items[scripBacktestIndex] = { ...res.data, loading: false };
                  my_scrips = items;
                  setBackTestResult(items);
                })
                .catch((err) => {
                  const scripBacktestIndex = my_scrips.findIndex((p) => {
                    return p.scrip_id === data.scrip_id;
                  });

                  const items = [...my_scrips];
                  const item = items[scripBacktestIndex];
                  if (err.response.data.errors) {
                    items[scripBacktestIndex] = {
                      ...item,
                      exchange: item.exchange,
                      loading: false,
                      errorMsg: err.response.data.errors.message,
                    };
                  }
                  my_scrips = items;
                  setBackTestResult(items);
                });
            });
          })
          .catch((err) => {
            for (const [key, value] of Object.entries(
              err.response.data.errors
            )) {
              GlobalToast.fire({
                icon: "error",
                text: value,
              });
              break;
            }
          });
      } // end of success if
    } else {
      setExitEntryData(methods.getValues());
      handleNext();
    }
  };

  const checkKeyDown = (e) => {
    if (e.code === "Enter") e.preventDefault();
  };
  return (
    <>
      <FormProvider {...methods}>
        <CustomForm
          onSubmit={methods.handleSubmit(onSubmit)}
          onKeyDown={(e) => checkKeyDown(e)}
        >
          <div className="row p-4 m-0">
            <div className="col-md-6 col-sm-12">
              <ShowStrategy
                isEdit={isEdit}
                isCopy={isCopyRun}
                methods={methods}
                buyData={buyData}
                sellData={sellData}
                symbolFormData={symbolFormData}
              />
            </div>
            <div className="col-md-6 col-sm-12">
              <CreateStrategy
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                methods={methods}
                buyData={buyData}
                sellData={sellData}
                exitEntryData={exitEntryData}
                setSellData={setSellData}
                setBuyData={setBuyData}
                buttonState={buttonState}
                setSymbolFormData={setSymbolFormData}
                symbolFormData={symbolFormData}
                strategyData={strategyData}
                isCopy={is_copy && isCopyRun === false}
                setBrickSize={setBrickSize}
              />
            </div>
          </div>
        </CustomForm>
      </FormProvider>
      <BackTestResult
        strategyData={strategyData}
        result={backtestResult}
        setResult={setBackTestResult}
        setButtonState={setButtonState}
      />
    </>
  );
};
const mapStateToProps = (state) => ({
  newStrategy: state.newStrategy,
});

const connectNewStrategyWrapper = withRouter(
  connect(mapStateToProps, null)(NewStrategyWrapper)
);
export default connectNewStrategyWrapper;
