var IMGURER = IMGURER || {};

IMGURER.run = (function() {

    // check to make sure we have an IMGURER key
    IMGURER.checkKey();

    // initialize the camera
    IMGURER.captureImage.init();

    IMGURER.template = kendo.template($("#urlTemplate").html());

    // initialize the uploads
    IMGURER.uploads.init();

    // create the application
    IMGURER.app = new kendo.mobile.Application(document.body);

               
});

IMGURER.show = (function() {
	$(document.body).show();
});

IMGURER.captureImage = function() {

	var pub = {};

	pub.init = function() {

		// attach the event to the capture image button
		$("#take-picture").on("click", function(e) {

			navigator.camera.getPicture(hollaback, errback, 
				{ quality: 50, destinationType: Camera.DestinationType.DATA_URL});

		});

		// camera success
		var hollaback = function(dataURL) {

			// upload the image to imgur
			IMGURER.upload(dataURL);

		}

		// camera error
		var errback = function(msg) {
			// just chill
		}
	}

	return pub;
}();

IMGURER.upload = (function(base64) {

	// check to make sure we are online
	var connectionType = navigator.network.connection.type;

	// if there is no internet connection
	if (connectionType === "unknown" || connectionType === "none") {
		// we can't upload the image so inform the user
		navigator.notification.alert("Not connected to the internet...", null, "Unable To Upload");
	}
	// otherwise, send it to IMGUR
	else {
		IMGURER.app.showLoading();
		$.ajax({
			url: "http://api.imgur.com/2/upload.json",
			type: "POST",
			data: {
				key: IMGURER.key,
				image: base64,
				title: "Taken With IMGURER",
				type: "base64"
			},
			dataType: "json",
			success: function(data) {
               IMGURER.app.hideLoading();
               $(".url-wrapper").html(IMGURER.template({ url: data.upload.links.imgur_page }));
               IMGURER.uploads.save(data.upload.links.imgur_page);
			},
			timeout: 20000,
			error: function(jqXHR, textStatus, errorThrown) {
				IMGURER.app.hideLoading();
				navigator.notification.alert(textStatus, null, "Upload Failed");
			}
		});
	}
});

IMGURER.checkKey = (function() {

	// check local storage to see if we have an IMGUR key stored
    IMGURER.key = window.localStorage.getItem("imgur_key");

    if (!IMGURER.key) {
    	
    	// get the modal window instance
    	var keyModal = $("#imgur-key-request").data("kendoMobileModalView");

    	// open the modal window
    	keyModal.open();

    	// attach an event listener to the save button
    	$("#save-imgur-key").on("click", function() {

    		// save the key in local storage
    		IMGURER.key = $("#imgur-key").val();
    		window.localStorage.setItem("imgur_key", IMGURER.key);


    		// if the user entered a key value, close
    		// the modal
    		if (IMGURER.key) {
    			keyModal.close();
    			IMGURER.settings.init();
    		}

    	});
    }
    else {
    	IMGURER.settings.init();
    }
});

IMGURER.uploads = function() {

	var pub = {},
        uploads = [];
    
	pub.init = function() {

		// read in the stored images from local storage
		uploads = window.localStorage.getItem("uploads") || [];
        
		IMGURER.history = new kendo.data.DataSource({
            data: uploads                                         
        });
        
        console.log(uploads);

	}
    
    pub.save = function(img) {
        
        console.log("saving the image!");
        
        // push the new image onto the array
        uploads.push(img);
        
        // save the images array to local storage
        window.localStorage.setItem("uploads", uploads);
    
        // refresh the datasource
        IMGURER.history.read();
    }

	return pub;

}();

IMGURER.settings = function() {

	var pub = {};

	pub.init = function() {

		// set the value of the key field to the IMGUR key
		$("#settings-imgur-key").val(IMGURER.key);

		// save the key when the user changes it here
		$("#settings-imgur-key").on("blur", function() {
			// save the IMGUR key when the user exists the field
			window.localStorage.setItem("imgur_key", this.value);
		});
	}

	return pub;

}();

// this function runs at startup and attaches to the 'deviceready' event
// which is fired by PhoneGap when the hardware is ready for native API
// calls. It is self invoking and will run immediately when this script file is 
// loaded.
(function() {
    if (navigator.userAgent.indexOf('Browzr') > -1) {
        // blackberry
        setTimeout(IMGURER.run, 250)    
    } else {
        // attach to deviceready event, which is fired when phonegap is all good to go.
        document.addEventListener('deviceready', IMGURER.run, false);
    }
})();