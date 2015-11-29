function showAirportDetails(airportId) {
	$.ajax({
		type: 'GET',
		url: "airports/" + airportId,
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    success: function(airport) {
	    	if (airport) {
	    		populateAirportDetails(airport)
	    		setActiveDiv($("#airportCanvas"))
	    	}
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
	            console.log(JSON.stringify(jqXHR));
	            console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
	    }
	});
}


function populateAirportDetails(airport) {
	 
	var airportMap = new google.maps.Map(document.getElementById('airportMap'), {
		//center: {lat: airport.latitude, lng: airport.longitude},
	   	zoom : 7,
	   	minZoom : 6
//	   	scrollwheel: false,
//	    navigationControl: false,
//	    mapTypeControl: false,
//	    scaleControl: false,
//	    draggable: false
	  });
	if (airport) {
		addCityMarkers(airportMap, airport.citiesServed)
		google.maps.event.addListenerOnce(airportMap, 'idle', function() {
		    google.maps.event.trigger(airportMap, 'resize');
		    airportMap.setCenter({lat: airport.latitude, lng: airport.longitude}); 
		});
		
		var airportMarkerIcon = $("#airportMap").data("airportMarker")
		new google.maps.Marker({
		    position: {lat: airport.latitude, lng: airport.longitude},
		    map: airportMap,
		    title: airport.name,
		    icon : airportMarkerIcon,
		    zIndex : 999
		  });
		
		new google.maps.Circle({
		        center: {lat: airport.latitude, lng: airport.longitude},
		        radius: airport.radius * 1000, //in meter
		        strokeColor: "#32CF47",
		        strokeOpacity: 0.2,
		        strokeWeight: 2,
		        fillColor: "#32CF47",
		        fillOpacity: 0.3,
		        map: airportMap
		    });
	}
}


function getAirports() {
	$.getJSON( "airports?count=600", function( data ) {
		  addMarkers(data)
	});
}

function addMarkers(airports) {
	var infoWindow = new google.maps.InfoWindow({
		maxWidth : 500
	})
	currentZoom = map.getZoom()
	var airportMarkerIcon = $("#map").data("airportMarker")
	var resultMarkers = {}
	for (i = 0; i < airports.length; i++) {
		  var airportInfo = airports[i]
		  var position = {lat: airportInfo.latitude, lng: airportInfo.longitude};
		  var marker = new google.maps.Marker({
			    position: position,
			    map: map,
			    title: airportInfo.name,
			    airportName: airportInfo.name,
		  		airportCode: airportInfo.iata,
		  		airportCity: airportInfo.city,
		  		airportId: airportInfo.id,
		  		airportSize: airportInfo.size,
		  		airportPopulation: airportInfo.population,
		  		airportIncomeLevel: airportInfo.incomeLevel,
		  		airportCountryCode: airportInfo.countryCode,
		  		airportSlots : airportInfo.slots,
		  		airportAvailableSlots: airportInfo.availableSlots,
		  		icon: airportMarkerIcon
			  });
		  
		  marker.addListener('click', function() {
			  infoWindow.close();
			  
			  var isBase = updateBaseInfo(this.airportId)
			  $("#airportPopupName").text(this.airportName)
			  $("#airportPopupIata").text(this.airportCode)
			  $("#airportPopupCity").text(this.airportCity)
			  $("#airportPopupSize").text(this.airportSize)
			  $("#airportPopupPopulation").text(this.airportPopulation)
			  $("#airportPopupIncomeLevel").text(this.airportIncomeLevel)
			  $("#airportPopupCountryCode").text(this.airportCountryCode)
			  $("#airportPopupSlots").text(this.airportAvailableSlots + " (" + this.airportSlots + ")")
			  updatePopupAppeal(this.airportId)
			  updatePopupSlots(this.airportId)
			  $("#airportPopupId").val(this.airportId)
			  infoWindow.setContent($("#airportPopup").html())
			  infoWindow.open(map, this);
			  
			  if (isBase) {
				  $("#planFromAirportButton").show()
				  $("#planFromAirportButton").click(function() {
					  planFromAirport($('#airportPopupId').val(), $('#airportPopupName').text())
					  infoWindow.close();
				  });
			  } else {
				  $("#planFromAirportButton").hide()
			  }
			  $("#planToAirportButton").click(function() {
				  planToAirport($('#airportPopupId').val(), $('#airportPopupName').text())
				  infoWindow.close();
			  });
		  });
		  marker.setVisible(isShowMarker(marker, currentZoom))
		  resultMarkers[airportInfo.id] = marker
	}
	
	//now assign it to markers to indicate that it's ready
	markers = resultMarkers
}

function addCityMarkers(airportMap, cities) {
	var infoWindow = new google.maps.InfoWindow({
		maxWidth : 500
	})
	var cityMarkerIcon = $("#airportMap").data("cityMarker")
	var townMarkerIcon = $("#airportMap").data("townMarker")
	var villageMarkerIcon = $("#airportMap").data("villageMarker")
	
	$.each(cities, function( key, city ) {
		var icon
		if (city.population >= 500000) {
			icon = cityMarkerIcon
		} else if (city.population >= 100000) {
			icon = townMarkerIcon
		} else {
			icon = villageMarkerIcon
		}
		var position = {lat: city.latitude, lng: city.longitude};
		  var marker = new google.maps.Marker({
			    position: position,
			    map: airportMap,
			    title: city.name,
			    cityInfo : city,
			    icon : icon
			  });
		  
		  marker.addListener('click', function() {
			  infoWindow.close();
			  var city = this.cityInfo
			  $("#cityPopupName").text(city.name)
			  $("#cityPopupPopulation").text(city.population)
			  $("#cityPopupIncomeLevel").text(city.incomeLevel)
			  $("#cityPopupCountryCode").text(city.countryCode)
			  $("#cityPopupId").val(city.id)
			   
			  infoWindow.setContent($("#cityPopup").html())
			  
			  
///////////////
				 ///////////////////////////!!!!!!!!!!
			$('#cityPie').highcharts({
		        chart: {
		            plotBackgroundColor: null,
		            plotBorderWidth: null,
		            plotShadow: false,
		            height: 200,
		            width: 200,
		            type: 'pie',
		        },
		        plotOptions: {
		            pie: {
		                allowPointSelect: true,
		                cursor: 'pointer',
		                size: '100%',
		                dataLabels: {
		                    enabled: true,
		                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
		                    style: {
		                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
		                    }
		                }
		            }
		        },
		        series: [{
		            name: "Brands",
		            colorByPoint: true,
		            data: [{
		                name: "Microsoft Internet Explorer",
		                y: 56.33
		            }, {
		                name: "Chrome",
		                y: 24.03,
		                sliced: true,
		                selected: true
		            }, {
		                name: "Firefox",
		                y: 10.38
		            }, {
		                name: "Safari",
		                y: 4.77
		            }, {
		                name: "Opera",
		                y: 0.91
		            }, {
		                name: "Proprietary or Undetectable",
		                y: 0.2
		            }]
		        }]
			  });
			  
			  infoWindow.open(airportMap, this);
			/////////////////////!!!!!!!!!!!!!!!
		 ///////////////
		  });
		  //marker.setVisible()
	});
}



function isShowMarker(marker, zoom) {
	return (marker.isBase) || ((zoom >= 4) && (zoom + marker.airportSize >= 9)) //start showing size >= 5 at zoom 4 
}

function updateBaseInfo(airportId) {
	$("#buildHeadquarterButton").hide()
	$("#buildBaseButton").hide()
	$("#airportIcons img").hide()
	if (!activeAirline.headquarterAirport) {
	  $("#buildHeadquarterButton").show()
	} else {
	  var baseAirport
	  for (i = 0; i < activeAirline.baseAirports.length; i++) {
		  if (activeAirline.baseAirports[i].airportId == airportId) {
			  baseAirport = activeAirline.baseAirports[i]
			  break
		  }
	  }
	  if (!baseAirport) {
	  	$("#buildBaseButton").show()
	  } else if (baseAirport.headquarter){ //a HQ
		$("#popupHeadquarterIcon").show() 
	  } else { //a base
		$("#popupBaseIcon").show()
	  }
	}
	return baseAirport
}

function updatePopupAppeal(airportId) {
	//clear the old ones
	$("#airportPopupAwareness").text()
	$("#airportPopupLoyalty").text()
	var airlineId = activeAirline.id
	$.ajax({
		type: 'GET',
		url: "airports/" + airportId,
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    success: function(airport) {
	    	var hasMatch = false
	    	$.each(airport.appealList, function( key, appeal ) {
	    		if (appeal.airlineId == airlineId) {
	    			$("#airportPopupAwareness").text(appeal.awareness)
	    			$("#airportPopupLoyalty").text(appeal.loyalty)
	    			hasMatch = true
	    		}
	  		});
	    	if (!hasMatch) {
	    		$("#airportPopupAwareness").text("0")
	    		$("#airportPopupLoyalty").text("0")
	    	}
	    	
//	    	hasMatch = false
//	    	$.each(airport.slotAssignmentList, function( key, slotInfo ) {
//	    		if (slotInfo.airlineId == airlineId) {
//	    			$("#airportPopupAssignedSlots").text(slotInfo.slotAssignment)
//	    			hasMatch = true
//	    		}
//	  		});
//	    	if (!hasMatch) {
//	    		$("#airportPopupAssignedSlots").text("0")
//	    	}
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
	            console.log(JSON.stringify(jqXHR));
	            console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
	    }
	});
}

function updatePopupSlots(airportId) {
	//clear the old ones
	$("#airportPopupAssignedSlots").text()
	var airlineId = activeAirline.id
	$.ajax({
		type: 'GET',
		url: "airports/" + airportId + "/slots?airlineId=" + airlineId,
	    dataType: 'json',
	    success: function(slotInfo) {
    		$("#airportPopupAssignedSlots").text(slotInfo.assignedSlots + " (" + slotInfo.maxSlots + ")")
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
	            console.log(JSON.stringify(jqXHR));
	            console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
	    }
	});
}

function updateAirportMarkers(airline) { //set different markers for head quarter and bases
	if (!markers) { //markers not ready yet, wait
		setTimeout(function() { updateAirportMarkers(airline) }, 100)
	} else {
		var headquarterMarkerIcon = $("#map").data("headquarterMarker")
		var baseMarkerIcon = $("#map").data("baseMarker")
		$.each(airline.baseAirports, function(key, baseAirport) {
			var marker = markers[baseAirport.airportId]
			if (baseAirport.headquarter) {
				marker.setIcon(headquarterMarkerIcon) 
			} else {
				marker.setIcon(baseMarkerIcon)
			}
			marker.setZIndex(999)
			marker.isBase = true
			marker.setVisible(true)
		})
	}
}



