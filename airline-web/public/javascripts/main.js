var map
var airportMap
var markers
var baseMarkers = []
var activeAirline
var activeUser
var selectedLink
var currentTime
var currentCycle
var airlineColors = {}
var polylines = []

$( document ).ready(function() {
	recordDimensions()
	mobileCheck()
	window.addEventListener('orientationchange', refreshMobileLayout)
	
	if ($.cookie('sessionActive')) {
		loadUser(false)
	} else {
		hideUserSpecificElements()
		refreshLoginBar()
		getAirports();
		printConsole("Please log in")
        showAbout();
	}
	
	loadAllCountries()
	updateAirlineColors()
	
	if ($("#floatMessage").val()) {
		showFloatMessage($("#floatMessage").val())
	}
	$(window).scroll(function()
	{
  		$('#floatBackButton').animate({top: ($(window).scrollTop() + 100) + "px" },{queue: false, duration: 350});
	});

	$('#chattext').jemoji({
        folder : 'assets/images/emoji/',
        btn:    $('#emojiButton')
    });

    Splitting();
    if (isIe()) {
        //remove all laser elements, as IE cannot handle it
        $(".laser").hide()
    }

	//plotSeatConfigurationGauge($("#seatConfigurationGauge"), {"first" : 0, "business" : 0, "economy" : 220}, 220)
})

function recordDimensions() {
	$('.mainPanel').each(function(index, panel) {
		$(panel).data("old-width", $(panel).css('width'))
		$(panel).data("old-height", $(panel).css('height'))
	})
	
	$('.sidePanel').each(function(index, panel) {
		$(panel).data("old-width", $(panel).css('width'))
	})
	
	//workaround, hardcode % for id sidePanel for now, for some unknown(?) reason, it returns 512px instead of 50%
	$('#sidePanel').data("old-width", '50%')
}

function mobileCheck() {
	if (window.screen.availWidth < 1024) { //assume it's a less powerful device
		refreshMobileLayout()
		$('.button, .button a').css('fontSize', 16)
		$('input').css('fontSize', 16)
		
		//turn off animation by default
		currentAnimationStatus = false
	}
}

function refreshMobileLayout() {
	if (window.screen.availWidth < window.screen.availHeight) { //only toggle layout change if it's landscape
		$('.mainPanel').css('width', '100%')
		$('.mainPanel').css('max-width', '100%')
		$('.mainPanel').css('height', '35%')
		$('.sidePanel').css('width', '100%')
		$('.sidePanel').css('max-width', '100%')
	} else {
		$('.mainPanel').each(function(index, panel) {
			$(panel).css('width', $(panel).data("old-width"))
			$(panel).css('max-width', $(panel).data("old-width"))
			$(panel).css('height', $(panel).data("old-height"))
		})
		
		$('.sidePanel').each(function(index, panel) {
			$(panel).css('width', $(panel).data("old-width"))
			$(panel).css('max-width', $(panel).data("old-width"))
		})
	}
}

function showFloatMessage(message, timeout) {
	timeout = timeout || 3000
	$("#floatMessageBox").text(message)
	var centerX = $("#floatMessageBox").parent().width() / 2 - $("#floatMessageBox").width() / 2 
	$("#floatMessageBox").css({ top:"-=20px", left: centerX, opacity:100})
	$("#floatMessageBox").show()
	$("#floatMessageBox").animate({ top:"0px" }, "fast", function() {
		if (timeout > 0) {
			setTimeout(function() { 
				console.log("closing")
				$('#floatMessageBox').animate({ top:"-=20px",opacity:0 }, "slow", function() {
					$('#floatMessageBox').hide()
				})
			}, timeout)
		}
	})
	
	//scroll the message box to the top offset of browser's scroll bar
	$(window).scroll(function()
	{
  		$('#floatMessageBox').animate({top:$(window).scrollTop()+"px" },{queue: false, duration: 350});
	});
}

function refreshLoginBar() {
	if (!activeUser) {
		setActiveDiv($("#loginDiv"))
	} else {
		$("#currentUserName").empty()
		$("#currentUserName").append(activeUser.userName + getUserLevelImg(activeUser.level))
		setActiveDiv($("#logoutDiv"))
	}
}

function loadUser(isLogin) {
	var ajaxCall = {
	  type: "POST",
	  url: "login",
	  async: false,
	  success: function(user) {
		  if (user) {
		    closeAbout()
			  activeUser = user
			  $.cookie('sessionActive', 'true');
			  $("#loginUserName").val("")
			  $("#loginPassword").val("")
			  
			  if (isLogin) {
				  showFloatMessage("Successfully logged in")
				  showAnnoucement()
			  }
    		  refreshLoginBar()
			  printConsole('') //clear console
			  getAirports();
			  showUserSpecificElements();
			  updateChatTabs()
			  
			  if (window.location.hostname != 'localhost') {
				  FS.identify(user.id, {
					  displayName: user.userName,
					  email: user.email
					 });
		      }
			  
		  }
		  if (user.airlineIds.length > 0) {
			  selectAirline(user.airlineIds[0])
			  loadAllCountries() //load country again for relationship
			  loadAllLogs()
		  }
		  
	  },
	    error: function(jqXHR, textStatus, errorThrown) {
	    	if (jqXHR.status == 401) {
	    		showFloatMessage("Incorrect username or password")
	    	} else {
	            console.log(JSON.stringify(jqXHR));
	            console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
	    	}
	    }
	}
	if (isLogin) {
		var userName = $("#loginUserName").val()
		var password = $("#loginPassword").val()
		ajaxCall.headers = {
			    "Authorization": "Basic " + btoa(userName + ":" + password)
		}

	}
	
	$.ajax(ajaxCall);
}

function passwordLogin(e) {
	if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
		login()
	}
}

function login()  {
	loadUser(true)
}

function onGoogleLogin(googleUser) {
	var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
	console.log('Name: ' + profile.getName());
	console.log('Image URL: ' + profile.getImageUrl());
	console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
	loginType='plain'
}

function logout() {
	$.ajax
	({
	  type: "POST",
	  url: "logout",
	  async: false,
	  success: function(message) {
	    	console.log(message)
	    	activeUser = null
	    	activeAirline = null
	    	hideUserSpecificElements()
	    	$.removeCookie('sessionActive')
	    	//refreshLoginBar()
	    	//showFloatMessage("Successfully logged out")
	    	location.reload();
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
	            console.log(JSON.stringify(jqXHR));
	            console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
	    }
	});
	
	removeMarkers()
}

function showUserSpecificElements() {
	$('.user-specific-tab').show()
	$('#topBarDetails').show()
}

function hideUserSpecificElements() {
	$('.user-specific-tab').hide()
	$('#topBarDetails').hide()
}


function initMap() {
	initStyles()
  map = new google.maps.Map(document.getElementById('map'), {
	center: {lat: 20, lng: 150.644},
   	zoom : 2,
   	minZoom : 2,
   	gestureHandling: 'greedy',
   	styles: getMapStyles() 
  });
	
  google.maps.event.addListener(map, 'zoom_changed', function() {
	    var zoom = map.getZoom();
	    // iterate over markers and call setVisible
	    $.each(markers, function( key, marker ) {
	        marker.setVisible(isShowMarker(marker, zoom));
	    })
  });  

  $("#toggleMapLightButton").index = 1
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($("#toggleMapLightButton")[0]);
  $("#toggleMapLightButton").show()
  
  $("#toggleMapAnimationButton").index = 2
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($("#toggleMapAnimationButton")[0]);
  $("#toggleMapAnimationButton").show()
  
  $("#toggleMapChristmasButton").index = 3
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($("#toggleMapChristmasButton")[0]);
  $("#toggleMapChristmasButton").show()
  
//  $("#linkHistoryButton").index = 2
//  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($("#linkHistoryButton")[0]);
  
//  map.controls[google.maps.ControlPosition.TOP_CENTER].push($("#hideLinkHistoryButton")[0]);
//  var linkControlDiv = document.createElement('div');
//  linkControlDiv.id = 'linkControlDiv';
//  var linkControl = new LinkHistoryControl(linkControlDiv, map);
//
//  $(linkControlDiv).hide()
//  
//  linkControlDiv.index = 1;
//  map.controls[google.maps.ControlPosition.TOP_CENTER].push(linkControlDiv);
//  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(hideLinkHistoryButton);
}

function LinkHistoryControl(controlDiv, map) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = ' 0px 1px 4px -1px rgba(0,0,0,.3)';
    //controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to recenter the map';
    controlUI.style.padding = '8px';
    controlUI.style.margin= '10px';
    controlUI.style.verticalAlign = 'middle';
    controlDiv.appendChild(controlUI);
    

    $(controlUI).append("<img src='assets/images/icons/24-arrow-180.png' class='button' onclick='toggleLinkHistoryView(false)'  title='Toggle passenger history view'/>")
    // Set CSS for the control interior.
    $(controlUI).append("<span id='linkHistoryText' style='color: rgb(86, 86, 86); font-family: Roboto, Arial, sans-serif; font-size: 11px;'></span>");
    
    $(controlUI).append("<img src='assets/images/icons/24-arrow.png' class='button' onclick='toggleLinkHistoryView(false)'  title='Toggle passenger history view'/>")

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener('click', function() {
      map.setCenter(chicago);
    });

  }


function updateAllPanels(airlineId) {
	updateAirlineInfo(airlineId)
	
	if (activeAirline) {
		if (!activeAirline.headquarterAirport) {
			showTutorial()
			printConsole("Zoom into the map and click on an airport icon. Select 'View Airport' to view details on the airport and build your airline Headquarter. Smaller airports will only show when you zoom close enough", 1, true, true)
		} else if ($.isEmptyObject(flightPaths)) {
			printConsole("Select another airport and click 'Plan Route' to plan your first route to it. You might want to select a closer domestic airport for shorter haul airplanes within your budget", 1, true, true)
//		} else {
//			printConsole("Adjustment to difficulty - high ticket price with less passengers. Coming soon: Departures Board! Flight delays and cancellation if airplane condition is too low. Flight code and number.")
		} else if (christmasFlag) {
		    printConsole("Breaking news - Santa went missing!!! Whoever finds Santa will be rewarded handsomely! He could be hiding in one of the size 6 or above airports! View the airport page to track him down!", true, true)
		}
		
	}
	
}

//does not remove or add any components
function refreshPanels(airlineId) {
	$.ajax({
		type: 'GET',
		url: "airlines/" + airlineId,
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    async: false,
	    success: function(airline) {
	    	activeAirline = airline
	    	refreshTopBar(airline)
	    	if ($("#worldMapCanvas").is(":visible")) {
	    		refreshLinks()
	    	}
	    	if ($("#linkDetails").is(":visible")) {
	    		refreshLinkDetails(selectedLink)
	    	}
	    	if ($("#linksCanvas").is(":visible")) {
	    		loadLinksTable()
	    	}
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
	            console.log(JSON.stringify(jqXHR));
	            console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
	    }
	});
}

var totalmillisecPerWeek = 7 * 24 * 60 * 60 * 1000
var refreshInterval = 5000 //every 5 second
var incrementPerInterval = totalmillisecPerWeek / (15 * 60 * 1000) * refreshInterval //by default 15 minutes per week
var durationTillNextTick
var hasTickEstimation = false
var refreshIntervalTimer
var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


function updateTime(cycle, fraction, cycleDurationEstimation) {
	currrentCycle = cycle
	currentTime = (cycle + fraction) * totalmillisecPerWeek 
	if (refreshIntervalTimer) {
	    //cancel old timer
	    clearInterval(refreshIntervalTimer)
	 }

	 if (cycleDurationEstimation > 0) { //update incrementPerInterval
	    incrementPerInterval = totalmillisecPerWeek / cycleDurationEstimation * refreshInterval
	    durationTillNextTick = cycleDurationEstimation * (1 - fraction)
	    hasTickEstimation = true
	 }
	 //start incrementing
	refreshIntervalTimer = setInterval( function() {
			currentTime += incrementPerInterval
			if (hasTickEstimation) {
			    durationTillNextTick -= refreshInterval
			}
			var date = new Date(currentTime)
			$("#currentTime").text("(" + days[date.getDay()] + ") " + padBefore(date.getMonth() + 1, "0", 2) + '/' + padBefore(date.getDate(), "0", 2) +  " " + padBefore(date.getHours(), "0", 2) + ":00")

			if (hasTickEstimation) {
			    var minutesLeft = Math.round(durationTillNextTick / 1000 / 60)
			    if (minutesLeft <= 0) {
			        $("#nextTickEstimation").text("Very soon")
			    } else if (minutesLeft == 1) {
			        $("#nextTickEstimation").text("1 minute")
			    } else {
			        $("#nextTickEstimation").text(minutesLeft + " minutes")
			    }
            }
		}, refreshInterval);

}


function printConsole(message, messageLevel, activateConsole, persistMessage) {
	messageLevel = messageLevel || 1
	activateConsole = activateConsole || false
	persistMessage = persistMessage || false
	var messageClass
	if (messageLevel == 1) {
		messageClass = 'actionMessage'
	} else {
		messageClass = 'errorMessage'
	}

	if (message == '') { //try to clear message, check if there was a persistent message
		var previousMessage = $('#console #consoleMessage').data('persistentMessage')
		if (previousMessage) {
			message = previousMessage
		}
	}
	
	if (persistMessage) {
		$('#console #consoleMessage').data('persistentMessage', message)
	}
	var consoleVisible = $('#console #consoleMessage').is(':visible')
	
	if (consoleVisible) {
		$('#console #consoleMessage').fadeOut('slow', function() { //fade out and reset positions
			$('#console #consoleMessage').text(message)
			$('#console #consoleMessage').removeClass().addClass(messageClass)
			$('#console #consoleMessage').fadeIn('slow')
		}) 
	} else {
		$('#console #consoleMessage').text(message)
		$('#console #consoleMessage').removeClass().addClass(messageClass)
		if (activateConsole) {
			$('#console #consoleMessage').fadeIn('slow')
		}
	}
}

function toggleConsoleMessage() {
	if ($('#console #consoleMessage').is(':visible')) {
		$('#console #consoleMessage').fadeOut('slow')
	} else {
		$('#console #consoleMessage').fadeIn('slow')
	}
}

function showWorldMap() {
	setActiveDiv($('#worldMapCanvas'));
	highlightTab($('#worldMapCanvasTab'))
	$('#sidePanel').appendTo($('#worldMapCanvas'))
	if (activeAirportPopupInfoWindow) {
		activeAirportPopupInfoWindow.close(map)
	}
	if (selectedLink) {
		selectLinkFromMap(selectedLink, true)
	}
}

function showAnnoucement() {
	// Get the modal
	var modal = $('#annoucementModal')
	// Get the <span> element that closes the modal
	$('#annoucementContainer').empty()
	$('#annoucementContainer').load('assets/html/annoucement.html')

	modal.fadeIn(1000)
}

function showTutorial() {
	// Get the modal
	var modal = $('#tutorialModal')
	modal.fadeIn(1000)
}

function promptConfirm(prompt, targetFunction, param) {
	$('#confirmationModal .confirmationButton').data('targetFunction', targetFunction)
	if (typeof param != 'undefined') {
		$('#confirmationModal .confirmationButton').data('targetFunctionParam', param)
	}
	$('#confirmationPrompt').html(prompt)
	$('#confirmationModal').fadeIn(1000)
}

function executeConfirmationTarget() {
	var targetFunction = $('#confirmationModal .confirmationButton').data('targetFunction')
	var targetFunctionParam = $('#confirmationModal .confirmationButton').data('targetFunctionParam')
	if (typeof targetFunctionParam != 'undefined') {
		targetFunction(targetFunctionParam) 
	} else {
		targetFunction()
	}
}

function updateAirlineColors() {
	var url = "colors"
    $.ajax({
		type: 'GET',
		url: url,
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    success: function(result) {
	    	airlineColors = result
	    },
        error: function(jqXHR, textStatus, errorThrown) {
	            console.log(JSON.stringify(jqXHR));
	            console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
	    }
	});
}

function assignAirlineColors(dataSet, colorProperty) {
	$.each(dataSet, function(index, entry) {
		if (entry[colorProperty]) {
			var airlineColor = airlineColors[entry[colorProperty]]
			if (airlineColor) {
				entry.color = airlineColor
			}
		}
	})
}

