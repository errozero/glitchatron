(function(){
	
	var glitchatron = {

		//Maximum image size
		max_width: 1024,
		max_height: 768,

		//Init image dimensions
		img_width: 0,
		img_height: 0,

		//canvas elements
		unglitched_canvas: document.getElementById('unglitched_canvas'),
		glitched_canvas: document.getElementById('glitched_canvas'),

		//save button
		save_button: document.getElementById('saveButton'),
		save_button_enabled: false,

		//init option vars
		glitch_level: 0,
		mask_option: '',
		text_overlay: '',
		text_colour: 'white',
		text_align: 'mc',
		text_font_size: 74,
		options_displayed: false,


		glitchometer: 0,

		file_changed: true,


		//----------------------------------------------------


		init: function() {

			//Bind buttons, menu actions etc
			document.getElementById("glitchButton").addEventListener("click", glitchatron.glitch);
			document.getElementById("saveButton").addEventListener("click", glitchatron.saveGlitch);
			document.getElementById("files").addEventListener("change", glitchatron.setFileChanged);
			document.getElementById("glitch_level").addEventListener("change", glitchatron.setGlitchLevel);
			document.getElementById("mask_option").addEventListener("change", glitchatron.setMaskOption);
			document.getElementById("text_overlay").addEventListener("change", glitchatron.setTextOverlay);
			document.getElementById("text_colour").addEventListener("change", glitchatron.setTextColour);
			document.getElementById("text_align").addEventListener("change", glitchatron.setTextAlign);
			document.getElementById("text_font_size").addEventListener("change", glitchatron.setTextFontSize);
			document.getElementById("more_text_options").addEventListener("click", glitchatron.toggleTextOptions);

			//Init options
			glitchatron.glitch_level = document.getElementById("glitch_level").value;
			glitchatron.mask_option  = document.getElementById("mask_option").value;
			glitchatron.text_overlay = document.getElementById("text_overlay").value;
			glitchatron.text_colour = document.getElementById("text_colour").value;
			glitchatron.text_align = document.getElementById("text_align").value;
			glitchatron.text_font_size = document.getElementById("text_font_size").value;

			//Show options if file is already selected on load (eg, firefox refresh)
			if(document.getElementById("files").files.length){
				glitchatron.fadeIn(document.getElementById("options_container"));
			}

		},


		//----------------------------------------------------


		loadImage: function() {

			//Loading cursor
			document.body.style.cursor = 'progress';

			//Get the file
			var files = document.getElementById('files').files;

			if (!files.length) {
			  alert('Please select a file!!');
			  return;
			}

			var file = files[0];

			//Check type
			if (file.type != "image/jpeg" && file.type != "image/jpg") {
			  alert('Only jpg images are allowed. This image is a ' + file.type);
			  return;
			}

			//Read file 
			var reader = new FileReader();

			reader.onloadend = function(evt) {
			  	
			  	if (evt.target.readyState == FileReader.DONE) { 

				  	//Get file data
					var data = evt.target.result;

					//Setup unglitched canvas
					var canvas = glitchatron.unglitched_canvas;
					var ctx = canvas.getContext('2d');

					//create image, base64 encode image data, resize and draw into canvas
					var img = new Image;
					img.src = 'data:image/jpeg;base64,' + btoa(data);

					img.onload = function(){

						//Set the width / height of the image according to max width/height settings
						glitchatron.img_width = img.width;
						glitchatron.img_height = img.height;

						if (glitchatron.img_width > glitchatron.img_height) {
						  if (glitchatron.img_width > glitchatron.max_width) {
						    glitchatron.img_height *= glitchatron.max_width / glitchatron.img_width;
						    glitchatron.img_width = glitchatron.max_width;
						  }
						} else {
						  if (glitchatron.img_height > glitchatron.max_height) {
						    glitchatron.img_width *= glitchatron.max_height / glitchatron.img_height;
						    glitchatron.img_height = glitchatron.max_height;
						  }
						}

						ctx.canvas.width = glitchatron.img_width;
						ctx.canvas.height= glitchatron.img_height;

					  //Draw the unglitched image
					  ctx.drawImage(img,0,0,glitchatron.img_width,glitchatron.img_height); 

					  console.log('Image Loaded');
					  glitchatron.glitchImage();
					  glitchatron.file_changed = false;

					  //Default cursor
					  document.body.style.cursor = 'default';

					}; //End img.onload

				} //end filereader.done

			} //end onloadend

			reader.readAsBinaryString(file);

		}, //end loadimage function

		//----------------------------------------------------

		glitchImage: function(){

			//Loading cursor
			document.body.style.cursor = 'progress';

			//Char Sets (these characters are found and changed around in the raw image data)
			var chars1 = ["0",")","<",">",".","*","&","£","%","~","#","+","a","!","|","-"];
			var chars2 = ["a","b","c","d","e","f","z","x","v","n","m","o","i","y","q","w"];

			//Select one of the character sets to use
			if( Math.floor((Math.random()*2)+1) == 2 ) 
				{ var chars = chars2; } 
			else 
				{ var chars = chars1; }


			//Check the level of glitch selected
			var glitch_levels = ["64","128","256","1024","1024"];
			var optionVal = glitchatron.glitch_level;
			var splitNum = glitch_levels[optionVal];

			//Setup glitched canvas - same dimensions as set by loadImage()
			var canvas = glitchatron.glitched_canvas;
			var ctx = glitched_canvas.getContext('2d');
			ctx.canvas.width = glitchatron.img_width;
			ctx.canvas.height = glitchatron.img_height;

			//Create mask if required
			glitchatron.createMask();

			//Get dataUrl from unglitched canvas
			var dataurl = glitchatron.unglitched_canvas.toDataURL("image/jpeg");

			//Remove the dataurl bit from the start and then base64 unencode 
			var newdata = dataurl.replace('data:image/jpeg;base64,','');
			newdata = atob(newdata);

			//Get length of each chunk
			var chunkLength = parseInt( (newdata.length - 1) / splitNum);
			
			//put data into chunks
			var chunks = [];
			for (var i = 0, charsLength = newdata.length; i < charsLength; i += chunkLength) {
				chunks.push(newdata.substring(i, i + chunkLength));
			}

			
			//Loop through chunks, leaving out the header chunk
			for(var i=2;i<=splitNum;i++) {
				
				//Create random number for the glitch decision
				var glitchRand = Math.floor((Math.random()*100)+1); 
				
				//If the extreme setting is chosen, make this number always odd so glitch is applied to every piece
				if(optionVal == 4) {
				glitchRand = 1;
				}
				
				//create random numbers for selection of the glitch characters
				var char1Rand = Math.floor((Math.random()*chars.length)); 
				var char2Rand = Math.floor((Math.random()*chars.length)); 
				
				if (char2Rand == char1Rand) {
					char2Rand = "9";
				}
				
				//If random number is odd 
				if(glitchRand % 2 != 0) {
					//glitch the chunk
					chunks[i] = chunks[i].replace(chars[char1Rand],chars[char2Rand]);
					
					//Add 1 to the glitchOmeter
					glitchatron.glitchOmeter = glitchatron.glitchOmeter + 1;
					}
				
			} //End chunk loop


			//recombine the chunks to get the glitched data
			newdata = chunks.join('');

			//Base64 encode the glitched data
			var base64data = btoa(newdata); 

			//Put the glitched image into the glitched canvas
			glitched_img = new Image();
			glitched_img.src = 'data:image/jpeg;base64,' + base64data;
			glitched_img.onload = function() {
				ctx.drawImage(glitched_img, 0, 0, ctx.canvas.width, ctx.canvas.height); 
				glitchatron.createText();

				//Enable save button
				if(!glitchatron.save_button_enabled) {
					var saveButtonContainer = document.getElementById("saveButtonContainer");
					glitchatron.fadeIn(saveButtonContainer);
					glitchatron.save_button_enabled = true;
				}
				
				console.log('GLITCH COMPLETE');

				//Default cursor
				document.body.style.cursor = 'default';
			}

		}, //End glitchImage function


		//----------------------------------------------------


		createMask: function(){

			//var optionVal = document.getElementById("glitch_level").value;
			if(glitchatron.mask_option == '') {
				return;
			}

			var shape = glitchatron.mask_option;
			var canvas = glitchatron.glitched_canvas;
			var ctx = canvas.getContext('2d');

			
			//Circle Mask
			if(shape == 'circle') {
				
				if(canvas.width > canvas.height) {
				var radius = canvas.height / 2;
				} else {
					var radius = canvas.width / 2;
				}	

				//Resize Canvas to the same size as the circle
				ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2); //centre point
				ctx.canvas.width = radius*2;
				ctx.canvas.height= radius*2;

				ctx.arc(ctx.canvas.width/2, ctx.canvas.height/2, radius, 0, 2 * Math.PI, false);
				ctx.clip();

				console.log('Circle Mask Created');

			} //End Circle Mask


			//Triangle Mask
			if(shape == 'triangle') {

				//Work out best side length
				if(canvas.width > canvas.height) {
					var sideLength = canvas.height;
				} else {
					var sideLength = canvas.width;
				}

				var h = sideLength * (Math.sqrt(3)/2);

				//Resize Canvas to the same size as triangle
				ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2); //centre point
				ctx.canvas.width = sideLength;
				ctx.canvas.height= sideLength - (h/7);

				var halfWidth  = canvas.width / 2;
				var halfHeight = canvas.height / 2;

				ctx.beginPath();
				ctx.moveTo(halfWidth, halfHeight - (h/2) ) ;
		        ctx.lineTo( halfWidth - (sideLength / 2), halfHeight + (h/2) );
		        ctx.lineTo(halfWidth + (sideLength / 2), halfHeight + (h/2) );
		        ctx.lineTo(halfWidth, halfHeight - (h/2) );
				ctx.closePath();
		    	ctx.clip();

			} //End Triangle Mask


			//Triangle 2 Mask
			if(shape == 'triangle2') {

				//Work out best side length
				if(canvas.width > canvas.height) {
					var sideLength = canvas.height;
				} else {
					var sideLength = canvas.width;
				}

				var h = sideLength * (Math.sqrt(3)/2);

				//Resize Canvas to the same size as triangle
				ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2); //centre point
				ctx.canvas.width = sideLength;
				ctx.canvas.height= sideLength - (h/7);

				var halfWidth  = canvas.width / 2;
				var halfHeight = canvas.height / 2;

				ctx.beginPath();
				ctx.moveTo(halfWidth, halfHeight + (h/2) ) ;
		        ctx.lineTo( halfWidth - (sideLength / 2), halfHeight - (h/2) );
		        ctx.lineTo(halfWidth + (sideLength / 2), halfHeight - (h/2) );
		        ctx.lineTo(halfWidth, halfHeight + (h/2) );
				ctx.closePath();
		    	ctx.clip();


			} //End Triangle2 Mask

		},


		//----------------------------------------------------


		createText: function(){
			var text_content = glitchatron.text_overlay;
			
			if(text_content != ''){

				var canvas = glitchatron.glitched_canvas;
				var ctx = canvas.getContext('2d');

				var h_align = 0;
				var v_align = 0;
				var text_align = 'start';
				var padding = 16;
				var base_line = 'middle';

				//Set text alignment vars
				if(glitchatron.text_align == 'tl'){
					h_align = padding;
					v_align = padding;
					base_line = 'top';
				}
				else if(glitchatron.text_align == 'tc'){
					h_align = ctx.canvas.width/2;
					v_align = padding;
					text_align = 'center';
					base_line = 'top';
				}
				else if(glitchatron.text_align == 'tr'){
					h_align = ctx.canvas.width - padding;
					v_align = padding;
					text_align = 'end';
					base_line = 'top';
				}
				else if(glitchatron.text_align == 'ml'){
					h_align = padding;
					v_align = ctx.canvas.height/2;
					text_align = 'start';
					base_line = 'middle';
				}
				else if(glitchatron.text_align == 'mc'){
					h_align = ctx.canvas.width/2;
					v_align = (ctx.canvas.height/2);
					text_align = 'center';
					base_line = 'middle';
				}
				else if(glitchatron.text_align == 'mr'){
					h_align = ctx.canvas.width - padding;
					v_align = (ctx.canvas.height/2);
					text_align = 'end';
					base_line = 'middle';
				}
				else if(glitchatron.text_align == 'bl'){
					h_align = padding;
					v_align = ctx.canvas.height;
					text_align = 'start';
					base_line = 'bottom';
				}
				else if(glitchatron.text_align == 'bc'){
					h_align = ctx.canvas.width/2;
					v_align = ctx.canvas.height;
					text_align = 'center';
					base_line = 'bottom';
				}
				else if(glitchatron.text_align == 'br'){
					h_align = ctx.canvas.width - padding;
					v_align = ctx.canvas.height;
					text_align = 'end';
					base_line = 'bottom';
				}

				
				ctx.textAlign = text_align;
				ctx.textBaseline = base_line;
				ctx.font="bold " + glitchatron.text_font_size + "px sans-serif";
				ctx.fillStyle = glitchatron.text_colour;
				ctx.fillText(text_content,h_align,v_align);
				console.log('TEXT DRAWN');
			}
		},


		//----------------------------------------------------


		saveGlitch: function(){

			//Enable save button
			document.body.style.cursor = 'progress';
			var savedata = glitchatron.glitched_canvas.toDataURL("image/png");
			var timestamp = new Date().getTime();
			glitchatron.save_button.href = savedata;
			glitchatron.save_button.download = 'Glitchatron_' + timestamp + '.png';
			document.body.style.cursor = 'default';

		},


		//----------------------------------------------------


		setGlitchLevel: function(){
			glitchatron.glitch_level = document.getElementById("glitch_level").value;
		},


		//----------------------------------------------------


		setMaskOption: function(){
			glitchatron.mask_option = document.getElementById("mask_option").value;
		},


		//----------------------------------------------------


		setFileChanged: function(){
			glitchatron.file_changed = true;
			
			if(!glitchatron.options_displayed){
				glitchatron.fadeIn(document.getElementById("options_container"));
				glitchatron.options_displayed = true;
			}
		},


		//----------------------------------------------------


		setTextOverlay: function(){
			glitchatron.text_overlay = document.getElementById("text_overlay").value;
		},


		//----------------------------------------------------


		setTextColour: function(){
			glitchatron.text_colour = document.getElementById("text_colour").value;
		},


		//----------------------------------------------------


		setTextAlign: function(){
			glitchatron.text_align = document.getElementById("text_align").value;
		},


		//----------------------------------------------------


		setTextFontSize: function(){
			glitchatron.text_font_size = document.getElementById("text_font_size").value;
		},


		//----------------------------------------------------


		toggleTextOptions: function(){
			var container = document.getElementById("text_options_container");
			var link = document.getElementById("more_text_options");
			if(container.className == 'hide') {
				container.className = '';
				glitchatron.fadeIn(container);
				link.innerHTML = '&#x25B2; Hide Text Options';
			} else {
				container.className = 'hide';
				link.innerHTML = '&#x25BC; Text Options';
			}
		},


		//----------------------------------------------------


		fadeIn: function(el) {
			el.style.display = 'block';
			el.style.opacity = 0;
			var last = +new Date();
		  	var tick = function() {
		    el.style.opacity = +el.style.opacity + (new Date() - last) / 400;
		    last = +new Date();

		    if (+el.style.opacity < 1) {
		      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16)
		    }

		  };

		  tick();
		},


		//----------------------------------------------------


		glitch: function(){

			//If a new file has been selected call loadImage, otherwise call glitchImage and use currently loaded image
			if(glitchatron.file_changed){
				glitchatron.loadImage();
			} else {
				glitchatron.glitchImage();
			}

		},

		//----------------------------------------------------


	};

	//Run!
	glitchatron.init();

}());