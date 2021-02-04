/**
 * jspsych-survey-semantic-diff
 * a jspsych plugin for measuring items on a likert scale
 *
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins['survey-semantic-diff'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'survey-semantic-diff',
    description: '',
    parameters: {
      questions: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: 'Questions',
        nested: {
          prompt: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: 'Prompt',
            default: undefined,
            description: 'Questions that are associated with the slider.'
          },
          labels: {
            type: jsPsych.plugins.parameterType.STRING,
            array: true,
            pretty_name: 'Labels',
            default: undefined,
            description: 'Labels to display for individual question.'
          },
          poles: {
            type: jsPsych.plugins.parameterType.STRING,
            array: true,
            pretty_name: 'Poles',
            default: undefined,
            description: 'Labels of the options at the poles. '
          },
          required: {
            type: jsPsych.plugins.parameterType.BOOL,
            pretty_name: 'Required',
            default: false,
            description: 'Makes answering the question required.'
          },
          name: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: 'Question Name',
            default: '',
            description: 'Controls the name of data values associated with this question'
          }
        }
      },
      randomize_question_order: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Randomize Question Order',
        default: false,
        description: 'If true, the order of the questions will be randomized'
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Preamble',
        default: null,
        description: 'String to display at top of the page.'
      },
      scale_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Scale width',
        default: null,
        description: 'Width of the likert scales in pixels.'
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button label',
        default:  'Continue',
        description: 'Label of the button.'
      },
      autocomplete: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow autocomplete',
        default: false,
        description: "Setting this to true will enable browser auto-complete or auto-fill for the form."
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    if(trial.scale_width !== null){
      var w = trial.scale_width + 'px';
    } else {
      var w = '100%';
    }

    var html = "";
    // inject CSS for trial
    html += '<style id="jspsych-survey-semantic-diff-css">';
    html += ".jspsych-survey-semantic-diff-statement { display:block; font-size: 16px; padding-top: 40px; margin-bottom:10px; }"+
      ".jspsych-survey-semantic-diff-opts { list-style:none; width:"+w+"; margin:auto; padding:0 0 35px; display:block; font-size: 14px; line-height:1.1em; }"+
      ".jspsych-survey-semantic-diff-opt-label { line-height: 1.1em; color: #444; }"+
      ".jspsych-survey-semantic-diff-opts-pole { position: relative; background: white }"+
      ".jspsych-survey-semantic-diff-opts:before { content: ''; position:relative; top:11px; /*left:9.5%;*/ display:block; background-color:#efefef; height:4px; width:100%; }"+
      ".jspsych-survey-semantic-diff-opts:last-of-type { border-bottom: 0; }"+
      ".jspsych-survey-semantic-diff-opts li { display:inline-block; /*width:19%;*/ text-align:center; vertical-align: top; }"+
      ".jspsych-survey-semantic-diff-opts li input[type=radio] { display:block; position:relative; top:0; left:50%; margin-left:-6px; }"
    html += '</style>';

    // show preamble text
    if(trial.preamble !== null){
      html += '<div id="jspsych-survey-semantic-diff-preamble" class="jspsych-survey-semantic-diff-preamble">'+trial.preamble+'</div>';
    }

    if ( trial.autocomplete ) {
      html += '<form id="jspsych-survey-semantic-diff-form">';
    } else {
      html += '<form id="jspsych-survey-semantic-diff-form" autocomplete="off">';
    }

    // add likert scale questions ///
    // generate question order. this is randomized here as opposed to randomizing the order of trial.questions
    // so that the data are always associated with the same question regardless of order
    var question_order = [];
    for(var i=0; i<trial.questions.length; i++){
      question_order.push(i);
    }
    if(trial.randomize_question_order){
      question_order = jsPsych.randomization.shuffle(question_order);
    }
    
    for (var i = 0; i < trial.questions.length; i++) {
      var question = trial.questions[question_order[i]];
      // add question
      html += '<label class="jspsych-survey-semantic-diff-statement">' + question.prompt + '</label>';
      // add options
      var width = 100 / (question.labels.length + 2);
      var options_string = '<ul class="jspsych-survey-semantic-diff-opts" data-name="'+question.name+'" data-radio-group="Q' + question_order[i] + '">';
      options_string += '<li style="width:' + width + '%" class="jspsych-survey-semantic-diff-opts-pole"> <label class="jspsych-survey-semantic-diff-opt-label">'+ question.poles[0] +'</label></li>';
      for (var j = 0; j < question.labels.length; j++) {
        options_string += '<li style="width:' + width + '%"><label class="jspsych-survey-semantic-diff-opt-label"><input type="radio" name="Q' + question_order[i] + '" value="' + j + '"';
        if(question.required){
          options_string += ' required';
        }
        options_string += '>' + question.labels[j] + '</label></li>';
      }
      options_string += '<li style="width:' + width + '%" class="jspsych-survey-semantic-diff-opts-pole"`> <label class="jspsych-survey-semantic-diff-opt-label">'+ question.poles[1] +'</label></li>';
      options_string += '</ul>';
      html += options_string;
    }

    // add submit button
    html += '<input type="submit" id="jspsych-survey-semantic-diff-next" class="jspsych-survey-semantic-diff jspsych-btn" value="'+trial.button_label+'"></input>';

    html += '</form>'

    display_element.innerHTML = html;

    display_element.querySelector('#jspsych-survey-semantic-diff-form').addEventListener('submit', function(e){
      e.preventDefault();
      // measure response time
      var endTime = performance.now();
      var response_time = endTime - startTime;

      // create object to hold responses
      var question_data = {};
      var matches = display_element.querySelectorAll('#jspsych-survey-semantic-diff-form .jspsych-survey-semantic-diff-opts');
      for(var index = 0; index < matches.length; index++){
        var id = matches[index].dataset['radioGroup'];
        var el = display_element.querySelector('input[name="' + id + '"]:checked');
        if (el === null) {
          var response = "";
        } else {
          var response = parseInt(el.value);
        }
        var obje = {};
        if(matches[index].attributes['data-name'].value !== ''){
          var name = matches[index].attributes['data-name'].value;
        } else {
          var name = id;
        }
        obje[name] = response;
        Object.assign(question_data, obje);
      }

      // save data
      var trial_data = {
        "rt": response_time,
        "responses": JSON.stringify(question_data),
        "question_order": JSON.stringify(question_order)
      };

      display_element.innerHTML = '';

      // next trial
      jsPsych.finishTrial(trial_data);
    });

    var startTime = performance.now();
  };

  return plugin;
})();
