/**
 * jspsych-video-semantic-diff-response
 * Gaspar Isaac Melsion <gimp@kth.se>, February 2021
 *
 * plugin for playing a video file and getting a semantic difference response
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["video-semantic-diff-response"] = (function () {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload(
    "video-semantic-diff-response",
    "stimulus",
    "video"
  );

  plugin.info = {
    name: "video-semantic-diff-response",
    description: "",
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.VIDEO,
        pretty_name: "Video",
        default: undefined,
        description: "The video file to play.",
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Prompt",
        default: null,
        description: "Any content here will be displayed below the stimulus.",
      },
      width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Width",
        default: "",
        description: "The width of the video in pixels.",
      },
      height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Height",
        default: "",
        description: "The height of the video display in pixels.",
      },
      autoplay: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Autoplay",
        default: true,
        description:
          "If true, the video will begin playing as soon as it has loaded.",
      },
      controls: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Controls",
        default: false,
        description:
          "If true, the subject will be able to pause the video or move the playback to any point in the video.",
      },
      start: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: "Start",
        default: null,
        description: "Time to start the clip.",
      },
      stop: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: "Stop",
        default: null,
        description: "Time to stop the clip.",
      },
      rate: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: "Rate",
        default: 1,
        description:
          "The playback rate of the video. 1 is normal, <1 is slower, >1 is faster.",
      },
      poles: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        pretty_name: "Poles labels",
        default: undefined,
        description: "Pole options for semantic difference.",
      },
      labels: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Labels",
        default: [],
        array: true,
        description: "Labels of the slider.",
      },
      slider_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Slider width",
        default: null,
        description: "Width of the slider in pixels.",
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Button label",
        default: "Continue",
        array: false,
        description: "Label of the button to advance.",
      },
      trial_ends_after_video: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "End trial after video finishes",
        default: false,
        description:
          "If true, the trial will end immediately after the video finishes playing.",
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Trial duration",
        default: null,
        description: "How long to show trial before it ends.",
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Response ends trial",
        default: true,
        description:
          "If true, the trial will end when subject makes a response.",
      },
      response_allowed_while_playing: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Response allowed while playing",
        default: true,
        description:
          "If true, then responses are allowed while the video is playing. " +
          "If false, then the video must finish playing before a response is accepted.",
      },
    },
  };

  plugin.trial = function (display_element, trial) {
    // half of the thumb width value from jspsych.css, used to adjust the label positions
    var half_thumb_width = 7.5;

    // variable with the full html
    let html = "";

    // inject CSS stylesheet for plugin
    let css_grid_cols = "auto";
    let css_grid_areas_r1 = "pl";
    let css_grid_areas_r2 = ".";
    for (let i = 0; i < trial.labels.length; i++) {
      css_grid_cols += " 1fr";
      css_grid_areas_r1 += " o" + i;
      css_grid_areas_r2 += " l" + i;
    }
    css_grid_cols += " auto";
    css_grid_areas_r1 += " pr";
    css_grid_areas_r2 += " .";

    html += `<style id="jspsych-survey-likert-css">
.jspsych-survey-semantic-diff-statement {
  display: block;
  font-size: 16px;
  padding-top: 40px;
  margin-bottom: 10px;
}

.jspsych-semantic-diff-container {
  position: relative;
  margin: 0 auto 3em auto;
  width: auto;
  display: grid;
  grid-template-columns: ${css_grid_cols};
  grid-template-rows: 1fr 1fr;
  grid-template-areas:
    "${css_grid_areas_r1}"
    "${css_grid_areas_r2}";
}

.jspsych-semantic-diff-pole {
  position: relative;
  background: white;
  padding: 0 1em;
}

.jspsych-semantic-diff-opt {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.jspsych-semantic-diff-opt input[type="radio"] {
  display: block;
  position: relative;
  margin: auto;
}

.jspsych-semantic-diff-label {
  line-height: 1.1em;
  color: #444;
  text-align: center;
  font-size: 80%;
}

.jspsych-semantic-diff-opt:before {
  content: "";
  position: absolute;
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  display: block;
  background-color: #efefef;
  height: 4px;
  width: 100%;
}
</style>
    `;

    // setup stimulus
    var video_html =
      '<video id="jspsych-video-semantic-diff-response-stimulus-video"';

    if (trial.width) {
      video_html += ' width="' + trial.width + '"';
    }
    if (trial.height) {
      video_html += ' height="' + trial.height + '"';
    }
    if (trial.autoplay & (trial.start == null)) {
      // if autoplay is true and the start time is specified, then the video will start automatically
      // via the play() method, rather than the autoplay attribute, to prevent showing the first frame
      video_html += " autoplay ";
    }
    if (trial.controls) {
      video_html += " controls ";
    }
    if (trial.start !== null) {
      // hide video element when page loads if the start time is specified,
      // to prevent the video element from showing the first frame
      video_html += ' style="visibility: hidden;"';
    }
    video_html += ">";

    var video_preload_blob = jsPsych.pluginAPI.getVideoBuffer(
      trial.stimulus[0]
    );
    if (!video_preload_blob) {
      for (var i = 0; i < trial.stimulus.length; i++) {
        var file_name = trial.stimulus[i];
        if (file_name.indexOf("?") > -1) {
          file_name = file_name.substring(0, file_name.indexOf("?"));
        }
        var type = file_name.substr(file_name.lastIndexOf(".") + 1);
        type = type.toLowerCase();
        if (type == "mov") {
          console.warn(
            "Warning: video-semantic-diff-response plugin does not reliably support .mov files."
          );
        }
        video_html +=
          '<source src="' + file_name + '" type="video/' + type + '">';
      }
    }
    video_html += "</video>";

    html +=
      '<div id="jspsych-video-semantic-diff-response-wrapper" style="margin: 100px 0px;">';
    html +=
      '<div id="jspsych-video-semantic-diff-response-stimulus">' +
      video_html +
      "</div>";
    html += `
    <div class="jspsych-semantic-diff-container" ${
      trial.slider_width !== null
        ? 'style="width: ' + trial.slider_width + 'px;"'
        : ""
    }>`;
    html += `
    <div
      class="jspsych-semantic-diff-pole"
      style="grid-area: pl"
    >
    ${trial.poles[0]}
    </div>
    `;
    html += `
    <div
      class="jspsych-semantic-diff-pole"
      style="grid-area: pr"
    >
    ${trial.poles[1]}
    </div>
    `;
    for (let i = 0; i < trial.labels.length; i++) {
      let label = trial.labels[i];
      html += `
      <div id="jspsych-video-semantic-diff-response-response" class="jspsych-semantic-diff-opt" style="grid-area: o${i}">
        <input type="radio" name="response" value="${i}" ${
        !trial.response_allowed_while_playing ? "disabled" : ""
      } />
      </div>
      `;
      html += `
      <div class="jspsych-semantic-diff-label" style="grid-area: l${i};">
      ${label}
      </div>
      `;
    }
    html += "</div>";
    html += "</div>";

    // add prompt if there is one
    if (trial.prompt !== null) {
      html += "<div>" + trial.prompt + "</div>";
    }

    // add submit button
    html +=
      '<button id="jspsych-video-semantic-diff-response-next" class="jspsych-btn" disabled>' +
      trial.button_label +
      "</button>";

    display_element.innerHTML = html;

    var video_element = display_element.querySelector(
      "#jspsych-video-semantic-diff-response-stimulus-video"
    );

    if (video_preload_blob) {
      video_element.src = video_preload_blob;
    }

    video_element.onended = function () {
      if (trial.trial_ends_after_video) {
        end_trial();
      } else if (!trial.response_allowed_while_playing) {
        enable_response();
      }
    };

    video_element.playbackRate = trial.rate;

    // if video start time is specified, hide the video and set the starting time
    // before showing and playing, so that the video doesn't automatically show the first frame
    if (trial.start !== null) {
      video_element.pause();
      video_element.currentTime = trial.start;
      video_element.onseeked = function () {
        video_element.style.visibility = "visible";
        if (trial.autoplay) {
          video_element.play();
        }
      };
    }

    if (trial.stop !== null) {
      video_element.addEventListener("timeupdate", function (e) {
        var currenttime = video_element.currentTime;
        if (currenttime >= trial.stop) {
          video_element.pause();
        }
      });
    }

    var startTime = performance.now();

    // store response
    var response = {
      rt: null,
      response: null,
    };

    display_element
      .querySelector("#jspsych-video-semantic-diff-response-next")
      .addEventListener("click", function () {
        // measure response time
        var endTime = performance.now();
        response.rt = endTime - startTime;
        response.response = display_element.querySelectorAll(
          ".jspsych-semantic-diff-opt input"
        );
        for (let i = 0; i < inputElems.length; i++) {
          let input = inputElems[i];
          if (input.checked) response.response = Number(input.value);
        }

        if (trial.response_ends_trial) {
          end_trial();
        } else {
          display_element.querySelector(
            "#jspsych-video-semantic-diff-response-next"
          ).disabled = true;
        }
      });

    let inputElems = display_element.querySelectorAll(
      ".jspsych-semantic-diff-opt input"
    );
    for (let i = 0; i < inputElems.length; i++) {
      inputElems[i].addEventListener("change", function () {
        display_element.querySelector(
          "#jspsych-video-semantic-diff-response-next"
        ).disabled = false;
      });
    }

    // function to end trial when it is time
    function end_trial() {
      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // stop the video file if it is playing
      // remove any remaining end event handlers
      display_element
        .querySelector("#jspsych-video-semantic-diff-response-stimulus-video")
        .pause();
      display_element.querySelector(
        "#jspsych-video-semantic-diff-response-stimulus-video"
      ).onended = function () {};

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
        stimulus: JSON.stringify(trial.stimulus),
        start: trial.start,
        slider_start: trial.slider_start,
        response: response.response,
      };

      // clear the display
      display_element.innerHTML = "";

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    }

    // function to enable slider after video ends
    function enable_response() {
      let elems = document.querySelectorAll(".jspsych-semantic-diff-opt input");
      for (let i = 0; i < elems.length; i++) {
        elems[i].disabled = false;
      }
    }

    // end trial if time limit is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function () {
        end_trial();
      }, trial.trial_duration);
    }
  };

  return plugin;
})();
