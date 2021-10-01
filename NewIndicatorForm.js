import React, { useState, memo } from "react";
import Controls from "../../controls/Controls";
import { useFormContext } from "react-hook-form";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { FormGroup } from "@material-ui/core";
import FormInputEvent from "../../controls/TextFieldEventSupport";

const IndicatorFormNew = (props) => {
  const {
    getValues,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const setValueAfterChange = (name, value, name2, dtype, range_arr) => {
    //console.log("name", name, " vlaue ", value, "ty", dtype, "arr ", range_arr);
    let reg = null;
    let lowerLimit = range_arr[0] === null ? -Infinity : Number(range_arr[0]);
    let upperLimit = range_arr[1] === null ? Infinity : Number(range_arr[1]);
    let val = null;

    if (dtype === "integer" && upperLimit <= 0) {
      reg = /^[-]?[0-9]*$/; //new RegExp(`^[^.][-+]?([0-9]+)$`,'gi')
      val = value === "-" ? "-0" : value;
      value = value.replaceAll(/^[0]{2,}/gi, "");
    } else if (dtype === "integer" && upperLimit > 0) {
      reg = /^[^-.a-zA-Z][0-9]*$/;
      val = value;
      value = value.replaceAll(/^0+/gi, "");
    } else if (dtype === "float" && lowerLimit === 0) {
      reg = new RegExp(
        "^[^-a-zA-Z]\\d{0," +
          (range_arr[2] - 1) +
          "}(\\.\\d{0," +
          range_arr[3] +
          "})?$"
      );
      val = value === "-" ? "-0" : value;
      // val = parseFloat(value)
    } else if (dtype === "float" && lowerLimit < 0) {
      reg = new RegExp(
        "^[-]?\\d{0," + range_arr[2] + "}(\\.\\d{0," + range_arr[3] + "})?$"
      );
      val = value === "-" ? "-0" : value;
    }

    if (reg.test(val) || value === "") {
      /*
          This code will take care of removing errors in indicator dialog for more
          than one
        */
      //     console.log(val)
      //  console.log("val is ",typeof(val))
      methods.setValue(name, value, { shouldValidate: true });
      if (val && !(lowerLimit <= val)) {
        setError(name2, {
          required: `Minimum value for this field is ${lowerLimit}`,
        });
        return;
      }
      if (val && (val > upperLimit || value === "-")) {
        //console.log("here we ")
        setError(name2, {
          required: `Maximum value for this field is ${upperLimit}`,
        });
        return;
      }

      clearErrors(name2);
    }
  };

  const methods = useFormContext();
  const [isTrigger, setOnChangeTrigger] = useState(false);

  const [centerTrigger, setCenterTrigger] = useState(false);
  const [comparatorBoxes, settingComparatorBox] = useState("");
  const [currentComparator, setCurrentComparator] = useState("");

  const [leftIndicatorComparatorValue, setLeftIndicatorComparatorValue] =
    useState("");
  var p_value = getValues("position_type");
  var comparator_value = "";
  const [comparatorChangeVal, setComparatorChangeVal] = useState("");
  var compareIndicatorDefaultValue = "";
  const {
    assistModeData,
    currentIndicator,
    isBuyOrSellRef,
    options,
    comparatorCenter,
    setPopup,
    setBuyData,
    buyData,
    setSellData,
    sellData,
    currentIndexField,
  } = props;

  var leftIndicatorValueAssist = null;
  var rightIndicatorValueAssist = null;
  // We are using fieldName variable so that we don't need to write this whole string to get field name
  const fieldName = `${isBuyOrSellRef.current}Indicator[${currentIndexField}]`;
  const fieldNameIndex = `${isBuyOrSellRef.current}Indicator[${0}]`;
  const prefilledData =
    isBuyOrSellRef.current === "sell" &&
    sellData &&
    sellData[currentIndexField] &&
    sellData[currentIndexField]?.indicator_name
      ? sellData[currentIndexField]
      : isBuyOrSellRef.current === "buy" &&
        buyData &&
        buyData[currentIndexField] &&
        buyData[currentIndexField]?.indicator_name
      ? buyData[currentIndexField]
      : null;

  const is_assist_required = p_value ? true : false;

  /* This function gives us data that is required for assist mode in
      sell and buy fields
    */
  const getPrefilledData = (is_comp = false) => {
    if (is_comp) {
      let d = comparatorCenter.find(
        (val) => val.title === prefilledData.comparator
      );

      return d?.field?.params;
    }
    let d = rightIndicators.find(
      (val) => val.cid === prefilledData.compareIndicatorItem
    );
    if (d) {
      return d.params;
    }
  };

  const getData = () => {
    let currentIndicatorAssist = assistModeData.find(
      (val) => val.indicator_id === currentIndicator?.value
    );

    if (
      !currentIndicatorAssist ||
      !is_assist_required ||
      !currentIndicatorAssist[p_value.toLowerCase()].length
    ) {
      return [];
    }
    //This code will check if buy or sell inside position is empty or not.
    currentIndicatorAssist =
      currentIndicatorAssist[p_value.toLowerCase()][0][isBuyOrSellRef.current];
    if (!currentIndicatorAssist[0]) {
      return [];
    }
    // This code will get comparator value
    comparator_value = comparatorCenter.find(
      (val) => val.id === currentIndicatorAssist[0].comparator_id
    );
    comparator_value = comparator_value?.title;

    return currentIndicatorAssist;
  };

  /* This wil set Assist Mode if position is selected or else set default */
  const getLeftData = () => {
    let assistDataAvail = getData();
    if (assistDataAvail.length === 0) {
      return [];
    }
    leftIndicatorValueAssist = assistDataAvail[0].indicatorDetails;

    return currentIndicator.params;
  };
  /* lData contain array of value that needs to be set on the left side */
  let lData = getLeftData();
  const leftData =
    is_assist_required && lData.length ? lData : currentIndicator?.params;

  /* Set left indicator fields */
  const leftIndicator = leftData?.map((leftVal, index) => {
    return (
      <div key={index} style={{ width: 280, height: 85 }}>
        {!leftVal.includes("dropdown") ? (
          <FormInputEvent
            errors={errors}
            onChange={(e) =>
              setValueAfterChange(
                `${fieldName}.indicatorDetails.${leftVal[0]}`,
                e.target.value,
                `${fieldNameIndex}.indicatorDetails.${leftVal[0]}`,
                leftVal[3],
                leftVal[4]
              )
            }
            label={leftVal[0]}
            isnested={"true"}
            control={control}
            name={`${fieldName}.indicatorDetails.${leftVal[0]}`}
            defaultValue={
              prefilledData
                ? prefilledData.indicatorDetails[leftVal[0]]
                : leftIndicatorValueAssist &&
                  leftIndicatorValueAssist[leftVal[0]]
                ? leftIndicatorValueAssist[leftVal[0]]
                : String(leftVal[1])
            }
          />
        ) : (
          <FormGroup>
            <Controls.FormSelect
              errors={errors}
              label={leftVal[0]}
              control={control}
              name={`${fieldName}.indicatorDetails.${leftVal[0]}`}
              defaultValue={
                prefilledData
                  ? prefilledData.indicatorDetails[leftVal[0]]
                  : leftIndicatorValueAssist &&
                    leftIndicatorValueAssist[leftVal[0]]
                  ? leftIndicatorValueAssist[leftVal[0]]
                  : leftVal[1]
              }
              isnested={"true"}
              options={leftVal[4].map((val) => {
                return {
                  id: val,
                  title: val,
                };
              })}
              rules={{
                required: "This field is required",
              }}
            ></Controls.FormSelect>
          </FormGroup>
        )}
      </div>
    );
  });
  /* *********left indicator fields related code ends here********* */

  /* 
        rightIndicators array contain value for right indicator value.
        Below code returns an array of objects for our Right Autocomplete
        element
   */

  var rightIndicators = [];
  currentIndicator &&
    currentIndicator.allowed_comparison.forEach((compare_val) => {
      options.forEach((val) => {
        if (val.function_group === compare_val) {
          return rightIndicators.push({
            label: val.label,
            tooltip: val.tooltip,
            description: val.description,
            name: val.name,
            params: val.params,
            syntax: val.syntax,
            cid: val.value,
          });
        }
      });
    });
  /* rightIndicator preparation code ends here */

  // IF assist mode is enabled then default value set by this code
  const getRightData = () => {
    let assistDataAvail = getData();
    if (assistDataAvail.length === 0) {
      return [];
    }

    rightIndicatorValueAssist = assistDataAvail[0].compareIndicatorDetails;
    let rightIndiData = options.find(
      (val) => val.value === assistDataAvail?.[0].compareIndicator_id
    );
    compareIndicatorDefaultValue = rightIndiData?.label || "";
    return rightIndiData?.params || [];
  };
  let rData = getRightData();

  const rightData =
    prefilledData && !isTrigger
      ? getPrefilledData()
      : is_assist_required && rData.length && !isTrigger
      ? rData
      : leftIndicatorComparatorValue.params;

  const rIndicator =
    rightData &&
    rightData.map((rightVal, index) => {
      return (
        <div
          key={index}
          style={{ width: 280, float: "right", marginRight: 2, height: 85 }}
        >
          {!rightVal.includes("dropdown") ? (
            <FormInputEvent
              errors={errors}
              isnested={"true"}
              label={rightVal[0]}
              onChange={(e) =>
                setValueAfterChange(
                  `${fieldName}.compareIndicatorDetails.${rightVal[0]}`,
                  e.target.value,
                  `${fieldNameIndex}.compareIndicatorDetails.${rightVal[0]}`,
                  rightVal[3],
                  rightVal[4]
                )
              }
              name={`${fieldName}.compareIndicatorDetails.${rightVal[0]}`}
              control={control}
              defaultValue={
                prefilledData
                  ? prefilledData.compareIndicatorDetails[rightVal[0]]
                  : rightIndicatorValueAssist &&
                    rightIndicatorValueAssist[rightVal[0]]
                  ? rightIndicatorValueAssist[rightVal[0]]
                  : String(rightVal[1])
              }
              rules={{
                required: "This field is required",
              }}
            ></FormInputEvent>
          ) : (
            <FormGroup>
              <Controls.FormSelect
                errors={errors}
                label={rightVal[0]}
                isnested={"true"}
                name={`${fieldName}.compareIndicatorDetails.${rightVal[0]}`}
                defaultValue={
                  prefilledData
                    ? prefilledData.compareIndicatorDetails[rightVal[0]]
                    : rightIndicatorValueAssist &&
                      rightIndicatorValueAssist[rightVal[0]]
                    ? rightIndicatorValueAssist[rightVal[0]]
                    : String(rightVal[1])
                }
                control={control}
                options={rightVal[4].map((val) => {
                  return {
                    id: val,
                    title: val,
                  };
                })}
                rules={{
                  required: "This field is required",
                }}
              ></Controls.FormSelect>
            </FormGroup>
          )}
        </div>
      );
    });

  const setRightTextBoxes = (label) => {
    setLeftIndicatorComparatorValue(label);
    setTimeout(
      () =>
        label.params.forEach((value, index) => {
          setValue(
            `${fieldName}.compareIndicatorDetails.${value[0]}`,
            String(value[1]),
            { shouldValidate: true }
          );
        }),
      10
    );
    let fieldName2 = `${isBuyOrSellRef.current}Indicator[${0}]`;
    methods.clearErrors(`${fieldName2}.compareIndicator`);
  };

  /* THis code will set value on comparator Indicator default and onCHange */
  const indicatorVal =
    prefilledData && !isTrigger
      ? rightIndicators.find(
          (val) =>
            val.label === prefilledData["compareIndicator"] ||
            val.name === prefilledData["compareIndicator"]
        )
      : is_assist_required && compareIndicatorDefaultValue && !isTrigger
      ? rightIndicators.find(
          (val) => val.label === compareIndicatorDefaultValue
        )
      : isTrigger
      ? rightIndicators.find(
          (val) => val.label === leftIndicatorComparatorValue.label
        )
      : null;

  /* handle right indicator code ends here */
  let cData =
    prefilledData && !centerTrigger
      ? getPrefilledData(true)  : currentComparator;
  const compDataSet =
    cData &&
    cData.map((compVal, index) => {
      return (
        <div
          key={index}
          style={{ width: 280, float: "right", marginRight: 2, height: 85 }}
        >
          {!compVal.includes("dropdown") ? (
            <FormInputEvent
              errors={errors}
              isnested={"true"}
              label={compVal[0]}
              onChange={(e) =>
                setValueAfterChange(
                  `${fieldName}.comparatorDetails.${compVal[0]}`,
                  e.target.value,
                  `${fieldNameIndex}.comparatorDetails.${compVal[0]}`,
                  compVal[3],
                  compVal[4]
                )
              }
              name={`${fieldName}.comparatorDetails.${compVal[0]}`}
              control={control}
              defaultValue={
                prefilledData
                  ? prefilledData?.comparatorDetails && prefilledData?.comparatorDetails[compVal[0]] ||String(compVal[1])
                  : String(compVal[1])
              }
              rules={{
                required: "This field is required",
              }}
            ></FormInputEvent>
          ) : (
            <FormGroup>
              <Controls.FormSelect
                errors={errors}
                label={compVal[0]}
                isnested={"true"}
                name={`${fieldName}.comparatorDetails.${compVal[0]}`}
                defaultValue={
                  prefilledData && !centerTrigger
                    ? prefilledData?.comparatorDetails && prefilledData?.comparatorDetails[compVal[0]] ||String(compVal[1])
                    : String(compVal[1])
                }
                control={control}
                options={compVal[4].map((val) => {
                  return {
                    id: val,
                    title: val,
                  };
                })}
                rules={{
                  required: "This field is required",
                }}
              ></Controls.FormSelect>
            </FormGroup>
          )}
        </div>
      );
    });

  /* Handling comparator update */

  const setComparatorBoxes = (comp_data) => {
    comparatorCenter.forEach((val) => {
      if (val.title === comp_data) {
        let compare_params = val.field.params;
        settingComparatorBox(compare_params);
        if (compare_params.length) {
          setCurrentComparator(compare_params);
          //   setTimeout(
          //     () =>
          //       compare_params.forEach((value, index) => {
          //         setValue(
          //           `${fieldName}.comparatorDetails.${value[0]}`,
          //           String(value[1]),
          //           { shouldValidate: true }
          //         );
          //       }),
          //     10
          //   );
        } else {
          setCurrentComparator(null);
        }
      }
    });
  };

  /* 
        This code handle formation of indicator sentence.
        And perform validation if next button is clicked
        code start here
    */

  //console.log(prefilledData);
  const sentenceFormation = (key_name) => {
    let values =
      getValues()[`${isBuyOrSellRef.current}Indicator`][currentIndexField];

    let second_condition = true;
    if (
      (prefilledData && currentIndicator.function_group !== "Candle Pattern") ||
      (is_assist_required &&
        currentIndicator.function_group !== "Candle Pattern")
    ) {
      values["compareIndicator"] = indicatorVal && indicatorVal["label"];
    }
    const new_values = {
      comparator: values.comparator,
      compareIndicator: values.compareIndicator,
    };

    let errorResult = indicatorFormSetErrors(
      values.indicatorDetails,
      "indicatorDetails",
      "left"
    );
    if (errorResult) {
      return;
    }

    // This check if comparator params is empty or not
    let errorcomparator = indicatorFormSetErrors(
      values.comparatorDetails,
      "comparatorDetails",
      "center"
    );
    if (errorcomparator) {
      return;
    }

    if (currentIndicator.function_group === "Candle Pattern") {
      // delete values.comparator;
      // delete values.compareIndicator;
    } else {
      indicatorFormSetErrors(new_values, false);
      let error_new = indicatorFormSetErrors(
        values.compareIndicatorDetails,
        "compareIndicatorDetails",
        "right"
      );
      if (error_new) {
        return;
      }
      second_condition = values?.compareIndicatorDetails
        ? !Object.values(values?.compareIndicatorDetails).includes("") &&
          !Object.values(values?.compareIndicatorDetails).includes(undefined)
        : true;
    }

    /* This will execute compareDetails Values and compareIndicatorDetails 
        values are not empty
        
      */
    let first_condition = values?.indicatorDetails
      ? !Object.values(values.indicatorDetails).includes("") &&
        !Object.values(values.indicatorDetails).includes(undefined)
      : true;
    if (second_condition && first_condition) {
      /*  This condition check if comparator and comparatorIndicator are
            are not empty
        */
      if (
        currentIndicator.function_group !== "Candle Pattern" &&
        (Object.values(new_values).includes("") ||
          Object.values(new_values).includes(undefined) ||
          Object.values(new_values).includes(null))
      ) {
        return;
      }
      // This code handle setting indicator sentence formation
      let myval = formatString(values);

      const newIndicator = {};
      newIndicator["label"] = myval;

      if (currentIndicator.function_group !== "Candle Pattern") {
        values["compareIndicatorItem"] =
          (indicatorVal && indicatorVal["cid"]) || indicatorVal["value"];
        values["comparatorItem"] =
          values.comparator &&
          comparatorCenter.find((val) => val.title === values.comparator).id;

        values["compareIndicatorName"] = indicatorVal?.name;
      }
      values["indicatorItem"] = currentIndicator["value"];
      values["new_name"] = currentIndicator["name"];

      // This code will prepare data for buyIndicator and sellIndicator
      if (isBuyOrSellRef.current === "buy") {
        if (buyData[currentIndexField]?.andOrValue) {
          values["andOrValue"] = buyData[currentIndexField]?.andOrValue;
        }

        buyData[currentIndexField]
          ? (buyData[currentIndexField] = values)
          : buyData.push(values);
        buyData[currentIndexField]["my_label"] = newIndicator;

        setBuyData(buyData);
      } else {
        if (sellData[currentIndexField]?.andOrValue) {
          values["andOrValue"] = sellData[currentIndexField]?.andOrValue;
        }
        sellData[currentIndexField]
          ? (sellData[currentIndexField] = values)
          : sellData.push(values);
        sellData[currentIndexField]["my_label"] = newIndicator;
        setSellData(sellData);
      }
      setPopup(false);
    } // End of main if
  }; // end of function

  function validationRules(index, dummyData, val) {
    let lowerLimit =
      dummyData[index][4][0] === null
        ? -Infinity
        : Number(dummyData[index][4][0]);
    let upperLimit =
      dummyData[index][4][1] === null
        ? Infinity
        : Number(dummyData[index][4][1]);

    val = val === "-" ? "-0" : String(val).trim();

    let val2 = Number(val);
    if (val2 < lowerLimit) {
      return `Minimum value for this field is ${lowerLimit}`;
    }
    if (val2 > upperLimit || val === "-0") {
      return `Maximum value for this field is ${upperLimit}`;
    }
    return false;
  }

  function indicatorFormSetErrors(data, istype, indOrComp = null) {
    const errorFieldName = `${isBuyOrSellRef.current}Indicator[${0}]`;
    const field = istype ? `${errorFieldName}.${istype}` : `${errorFieldName}`;
    const validData =
      indOrComp === "left"
        ? leftData
        : indOrComp === "right"
        ? rightData
        : indOrComp === "center"
        ? comparatorBoxes
        : null;

    let index = 0;
    let validObj = "";
    for (let property in data) {
      if (
        indOrComp !== "center" &&
        indOrComp != null &&
        validData[index][3] !== "dropdown"
      ) {
        validObj = validationRules(index, validData, data[property]);
      }

      if (!data[property]) {
        setError(`${field}.${property}`, {
          required: "This field is required",
        });
      } else if (validObj) {
        setError(`${field}.${property}`, {
          required: validObj,
        });
      } else {
        clearErrors(`${field}.${property}`);
        //clearErrors(`${isBuyOrSellRef.current}Indicator`)
      }

      index = index + 1;
    }
    //console.log(errors);
    let test_err =
      errors[`${isBuyOrSellRef.current}Indicator`]?.[0]?.[`${istype}`] || {};
    if (Object.keys(test_err).length || false) {
      return true;
    }
    return false;
  }
  // Sentence formation code
  function formatString(data) {
    let leftSyntax = "";
    if (currentIndicator.params.length === 0) {
      leftSyntax = currentIndicator.syntax;
    } else {
      leftSyntax = prepareSyntax(currentIndicator, data);
    }

    if (currentIndicator.function_group !== "Candle Pattern") {
      let rightSyntax = "";
      let centerSyntax = data["comparator"];
      let compIndi = rightIndicators.find(
        (val) => val.label === data["compareIndicator"]
      );
      if (compIndi.params.length === 0) {
        rightSyntax = compIndi.syntax;
      } else {
        rightSyntax = prepareSyntax(compIndi, data, false);
      }

      let d = comparatorCenter.find((val) => val.title === data["comparator"]);

      if (d) {
        centerSyntax = prepareSyntax(d.field, data, false, true);
      }

      return leftSyntax + " " + centerSyntax + " " + rightSyntax;
    }
    return leftSyntax;
  }

  function prepareSyntax(myStr, data, isLeft = true, isCenter = false) {
    let sentence = "";
    let syntax = myStr.syntax;
    let obj = {
      ...data.indicatorDetails,
      ...(!isLeft && data.compareIndicatorDetails),
      ...(isCenter && data.comparatorDetails),
    };

    var RE = new RegExp(Object.keys(obj).join("|"), "gi");
    sentence = syntax.replace(RE, function (matched) {
      return obj[matched];
    });
    return sentence.replace(/<|>/g, "");
  }
  return (
    <>
      <div className="row">
        <div className="col-md-4">
          <Controls.FormInput
            isnested={"true"}
            name={`${fieldName}.indicator_name`}
            control={control}
            label="Indicator"
            readOnly={true}
            defaultValue={currentIndicator?.label}
          />
        </div>
        <div
          className="col-md-4"
          style={{
            visibility:
              currentIndicator?.function_group === "Candle Pattern"
                ? "hidden"
                : "visible",
          }}
        >
          <FormGroup>
            <Controls.FormSelect2
              noError={true}
              errors={errors}
              isnested={"true"}
              name={`${fieldName}.comparator`}
              label="Comparator"
              control={control}
              onChangeNew={(data) => {
                methods.setValue(`${fieldName}.comparator`, data.target.value);
                setComparatorChangeVal(data.target.value);
                setCenterTrigger(true);
                setComparatorBoxes(data.target.value);
                methods.clearErrors(`${fieldNameIndex}.comparator`);
                //return data.target.value;
              }}
              options={comparatorCenter}
              defaultValue={
                prefilledData
                  ? prefilledData["comparator"] ||
                    comparatorCenter.find(
                      (val) => val.id === prefilledData["comparatorItem"]
                    )
                  : is_assist_required
                  ? comparator_value
                  : ""
              }
              value={
                comparatorChangeVal
                  ? comparatorChangeVal
                  : prefilledData
                  ? prefilledData["comparator"] ||
                    comparatorCenter.find(
                      (val) => val.id === prefilledData["comparatorItem"]
                    )
                  : is_assist_required
                  ? comparator_value
                  : ""
              }
            />
          </FormGroup>
        </div>
        <div
          className="col-md-4"
          style={{
            visibility:
              currentIndicator?.function_group === "Candle Pattern"
                ? "hidden"
                : "visible",
          }}
        >
          <Controls.FormAutoComplete
            isnested={"true"}
            errors={errors}
            name={`${fieldName}.compareIndicator`}
            control={control}
            fullWidth={true}
            label="Compare Indicator"
            defaultValue={indicatorVal}
            options={rightIndicators}
            onChange={(data, e) => {
              setOnChangeTrigger(true);
              setRightTextBoxes(data);
            }}
            value={indicatorVal}
          />
        </div>
      </div>
      {/* End of first row here */}
      <h4 className="p-2" style={{ marginLeft: -8 }}>
        Parameters
      </h4>
      <div className="row">
        <div className="col-md-4">{leftIndicator}</div>
        <div className="col-md-4">{compDataSet}</div>
        <div className="col-md-4">
          <div className="right-side">{rIndicator}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Controls.Button
          text="DONE"
          size="small"
          onKeyPress={(event) => {
            sentenceFormation(event.key);
            event.preventDefault();
          }}
          onClick={(event) => sentenceFormation(event)}
        />
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  comparatorCenter: state.newStrategy.rightIndicator,
});

const connectIndicatorFormNew = withRouter(
  connect(mapStateToProps, null)(IndicatorFormNew)
);

export default memo(connectIndicatorFormNew);
