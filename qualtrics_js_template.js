Qualtrics.SurveyEngine.addOnload(function()
{
	
	var buildName = 'qualifier';
	/*Place your JavaScript here to run when the page loads*/
	this.hideNextButton();
	this.hidePreviousButton();
	
	var q = this;
	
	/* Define the data saving function */
	window.dataFun = function (tag, str) {
		str = str.replace(/(?:\r\n|\r|\n)/g, ' <br> ');
		console.log("DataFun Says: " + str);
		switch tag {
			case 'session':
				Qualtrics.SurveyEngine.setEmbeddedData( 'SessionData', str );
				break;
			case 'trials':
				Qualtrics.SurveyEngine.setEmbeddedData( 'TrialData', str );
				break;
			default:
				alert('Error saving data. Please contact the experimenters.');
				console.log('Unrecognized dataFun tag: ' + tag);
				console.log('Attached payload: ' + str);
		}
		q.showNextButton();
		console.log("calling clickNextButton.");
		q.clickNextButton();
	};
	
	/* Where things are on the internet */
	var buildUrl = "https://btfiles.github.io/" + buildName + "/Build";
	var loaderUrl = buildUrl + "/" + buildName + ".loader.js";
	
	const target_width = 1024; // pixels
	const target_height = 768;
	
	/* Clunky function to force the canvas to the right size */
	function resize() {
		var dpr = window.devicePixelRatio; // physical pixels per css pixel
		var css_w_px = target_width/dpr;
		var css_h_px = target_height/dpr;
		console.log("Target converted to CSS Pixels: " + css_w_px + "px, " + css_h_px + "px.");
		var div = document.getElementById("unity-canvas");
		div.style.width = css_w_px + "px";
		div.style.height = css_h_px + "px";
		console.log("resized.");

		var qquestion = q.getQuestionContainer();
		qquestion.style.height = css_h_px + "px";
		qquestion.style.width = css_w_px + "px";

	};
	
	/* test for WebGL2 */
	function webgl2check(canv) {
		var badImpl = false;
		try { gl = canv.getContext("webgl2"); }
		catch (x) { gl = null; }

		if (gl) {
			// check if it really supports WebGL2. Issues, Some browers claim to support WebGL2
			// but in reality pass less than 20% of the conformance tests. Add a few simple
			// tests to fail so as not to mislead users.
			var params = [
				{ pname: 'MAX_3D_TEXTURE_SIZE', min: 256, },
				{ pname: 'MAX_DRAW_BUFFERS', min:4, },
				{ pname: 'MAX_COLOR_ATTACHMENTS', min:4, },
				{ pname: 'MAX_VERTEX_UNIFORM_BLOCKS', min:12, },
				{ pname: 'MAX_VERTEX_TEXTURE_IMAGE_UNITS', min:16, },
				{ pname: 'MAX_FRAGMENT_INPUT_COMPONENTS', min:60, },
				{ pname: 'MAX_UNIFORM_BUFFER_BINDINGS', min:24, },
				{ pname: 'MAX_COMBINED_UNIFORM_BLOCKS', min:24, },
			];
			for (var i = 0; i < params.length; ++i) {
				var param = params[i];
				var value = gl.getParameter(gl[param.pname]);
				if (typeof value !== 'number' || Number.isNaN(value) || value < params.min) {
					gl = null;
					badImpl = true;
					break;
				}
			}
		}
		var may_continue;
		if (gl && !badImpl) {
			console.log("Passed GL2.0 check.");
			may_continue = true;
		} else {
			window.alert("This browser does not appear to support WebGL2. Please enable WebGL2 on your browser, update your browser to the latest version, and/or try a different browser.");
			may_continue = false;
			q.showPreviousButton();
		}
		return may_continue;
	};
	
	/* setup the webgl */
	jQuery.getScript(loaderUrl, function (data, textStatus, jqhxr) {
		var config = {
			dataUrl: buildUrl + "/" + buildName + ".data.unityweb",
			frameworkUrl: buildUrl + "/" + buildName + ".framework.js.unityweb",
			codeUrl: buildUrl + "/" + buildName + ".wasm.unityweb",
			streamingAssetsUrl: "StreamingAssets",
			companyName: "CCDC ARL",
			productName: "QUVE_" + buildName,
			productVersion: "0.1",
		};

		var container = document.querySelector("#unity-container");
		var canvas = document.querySelector("#unity-canvas");
		var loadingBar = document.querySelector("#unity-loading-bar");
		var progressBarFull = document.querySelector("#unity-progress-bar-full");
		var fullscreenButton = document.querySelector("#unity-fullscreen-button");
		var footer = document.querySelector("#unity-footer");
		fullscreenButton.style.display="none";
		
		const resizeObserver = new ResizeObserver(entries => {
			console.log("Resize Observed!");
			resize();
		});
		resizeObserver.observe(container);
		resizeObserver.observe(canvas);
		

		if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
			container.className = "unity-mobile";
			config.devicePixelRatio = 1;
		} else {
			canvas.style.width = target_width + "px";
			canvas.style.height = target_height + "px";
		}
		loadingBar.style.display = "block";

		if (webgl2check(canvas)) {
			createUnityInstance(canvas, config, (progress) => {
				progressBarFull.style.width = 100 * progress + "%";
			}).then((unityInstance) => {
				/* last-minute layout things */
				loadingBar.style.display = "none";
				fullscreenButton.onclick = () => {
					//unityInstance.SetFullscreen(1);
				};
				fullscreenButton.style.display="none";
				footer.style.visibility='hidden';
				footer.style.height='0px';
				container.addEventListener("click", resize);
			    canvas.addEventListener("click", resize);
			}).catch((message) => {
				alert(message);
			});
		} else {
			container.style.visibility='hidden';
			container.style.height='0px';
		};
	});

});

Qualtrics.SurveyEngine.addOnReady(function()
{
	/*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/
	this.showNextButton();
	this.showPreviousButton();

});