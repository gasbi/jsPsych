/**
 * jspsych-survey-likert-table
 * a jspsych plugin for measuring items on a likert scale on a table layout with the same scale.
 *
 * Gaspar I. Melsion
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins["survey-likert-table"] = (function () {
  var plugin = {};

  plugin.info = {
    name: "survey-likert-table",
    description: "",
    parameters: {
      labels: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        pretty_name: "Labels",
        default: undefined,
        description: "Labels to display for all questions at the top.",
      },
      questions: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: "Questions",
        nested: {
          prompt: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: "Prompt",
            default: undefined,
            description: "Questions that are associated with the slider.",
          },
          required: {
            type: jsPsych.plugins.parameterType.BOOL,
            pretty_name: "Required",
            default: false,
            description: "Makes answering the question required.",
          },
          name: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: "Question Name",
            default: "",
            description:
              "Controls the name of data values associated with this question",
          },
        },
      },
      randomize_question_order: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Randomize Question Order",
        default: false,
        description: "If true, the order of the questions will be randomized",
      },
      alternate_row_color: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Alternate Row Color",
        default: true,
        description:
          "If true, the rows will alternate background color for clarity.",
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Preamble",
        default: null,
        description: "String to display at top of the page.",
      },
      table_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Scale width",
        default: null,
        description: "Width of the likert scales in pixels.",
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Button label",
        default: "Continue",
        description: "Label of the button.",
      },
      autocomplete: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Allow autocomplete",
        default: false,
        description:
          "Setting this to true will enable browser auto-complete or auto-fill for the form.",
      },
    },
  };

  plugin.trial = function (display_element, trial) {
    if (trial.table_width !== null) {
      var w = trial.table_width;
    } else {
      var w = "100%";
    }

    let css_grid_cols = `40px [statement-start] auto [statement-end labels-start] repeat(${trial.labels.length}, [label-start] 1fr [label-end]) [labels-end]`;
    let css_grid_rows = `1fr repeat(${trial.questions.length}, [q-start] 1fr [q-end])`;

    var html = "";
    // inject CSS for trial
    html += `<style id="jspsych-survey-likert-table-css">
    
    .jspsych-survey-likert-table-wrapper {
      position: relative;
      margin: 0 auto 3em auto;
      width: ${w};
      display: grid;
      grid-template-columns: ${css_grid_cols};
      grid-template-rows: ${css_grid_rows};
    }
    
    .jspsych-survey-likert-table-label {
      line-height: 1.3em;
      color: #444;
      text-align: center;
      font-size: 80%;
      margin: auto;
      padding: 10px;
    }
    
    .jspsych-survey-likert-table-statement { 
      font-size: 16px;
      margin: auto;
      padding: 10px;
      line-height: 1.3em;
    }
    .jspsych-survey-likert-table-opt {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .jspsych-survey-likert-table-opt input[type="radio"] {
      display: block;
      position: relative;
      margin: auto;
    }

    .table-line-bottom {
      border-bottom: 1px solid lightgray;
    }
    .table-line-right {
      border-right: 1px solid lightgray;
    }
    .table-bg-color-alt {
      background: #F8F8F8;
      z-index: -1;
    }
</style>`;

    // show preamble text
    if (trial.preamble !== null) {
      html +=
        '<div id="jspsych-survey-likert-table-preamble" class="jspsych-survey-likert-table-preamble">' +
        trial.preamble +
        "</div>";
    }

    if (trial.autocomplete) {
      html += '<form id="jspsych-survey-likert-table-form">';
    } else {
      html += '<form id="jspsych-survey-likert-table-form" autocomplete="off">';
    }

    html +=
      '<div id="jspsych-survey-likert-table-wrapper" class="jspsych-survey-likert-table-wrapper">';

    // fill header
    for (let i = 0; i < trial.labels.length; i++) {
      html += `<div class="jspsych-survey-likert-table-label" style="grid-column: label-start ${
        i + 1
      } / span 1; grid-row: 1">
      ${trial.labels[i]}
      </div>`;
    }

    // Table styling
    // Lines
    html +=
      '<div class="table-line-bottom" style="grid-column: 1 / -1; grid-row: 1"></div>';
    html +=
      '<div class="table-line-right" style="grid-column: 2; grid-row: 1 / -1"></div>';
    // Alternate Row Color
    if (trial.alternate_row_color) {
      for (let i = 2; i <= trial.questions.length + 1; i++) {
        if (!(i % 2)) {
          html += `<div class="table-bg-color-alt" style="grid-column: 1 / -1; grid-row: ${i}"> </div>`;
        }
      }
    }

    // add likert scale questions
    // generate question order. this is randomized here as opposed to randomizing the order of trial.questions
    // so that the data are always associated with the same question regardless of order
    var question_order = [];
    for (var i = 0; i < trial.questions.length; i++) {
      question_order.push(i);
    }
    if (trial.randomize_question_order) {
      question_order = jsPsych.randomization.shuffle(question_order);
    }

    for (var i = 0; i < trial.questions.length; i++) {
      var question = trial.questions[question_order[i]];
      let gr = `q-start ${i + 1} / span 1 q-start`;
      // add question
      html += `<div 
        class="jspsych-survey-likert-table-statement" 
        style="grid-column: 1; grid-row: ${gr}">
        ${i + 1})
      </div>`;
      html += `<div 
        class="jspsych-survey-likert-table-statement" 
        style="grid-column: statement-start / statement-end; grid-row: q-start ${
          i + 1
        } / span 1 q-start">
        ${question.prompt}
      </div>`;
      // add options
      for (var j = 0; j < trial.labels.length; j++) {
        html += `<div
          class="jspsych-survey-likert-table-opt"
          style="grid-column: label-start ${
            j + 1
          } / span 1 label-start; grid-row: ${gr}" 
          data-name="${question.name}" 
          data-radio-group="Q${question_order[i]}">`;
        html += `
        <input type="radio" name="Q${question_order[i]}" value="${j}" ${
          question.required ? " required" : ""
        }>`;
        html += "</div>";
      }
    }

    html += "</div>"; // wrapper (grid)

    // add submit button
    html +=
      '<input type="submit" id="jspsych-survey-likert-table-next" class="jspsych-survey-likert-table jspsych-btn" value="' +
      trial.button_label +
      '"></input>';

    html += "</form>";

    display_element.innerHTML = html;

    display_element
      .querySelector("#jspsych-survey-likert-table-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        // measure response time
        var endTime = performance.now();
        var response_time = endTime - startTime;

        // create object to hold responses
        var question_data = {};
        var matches = display_element.querySelectorAll(
          "#jspsych-survey-likert-table-form .jspsych-survey-likert-table-opt"
        );
        for (var index = 0; index < matches.length; index++) {
          var id = matches[index].dataset["radioGroup"];
          var el = display_element.querySelector(
            'input[name="' + id + '"]:checked'
          );
          if (el === null) {
            var response = "";
          } else {
            var response = parseInt(el.value);
          }
          var obje = {};
          if (matches[index].attributes["data-name"].value !== "") {
            var name = matches[index].attributes["data-name"].value;
          } else {
            var name = id;
          }
          obje[name] = response;
          Object.assign(question_data, obje);
        }

        // save data
        var trial_data = {
          rt: response_time,
          responses: JSON.stringify(question_data),
          question_order: JSON.stringify(question_order),
        };

        display_element.innerHTML = "";

        // next trial
        jsPsych.finishTrial(trial_data);
      });

    var startTime = performance.now();
  };

  return plugin;
})();
