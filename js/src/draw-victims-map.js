import * as L from "leaflet";
import "leaflet-providers";
import getTribColor from './getTribColors.js';
import getJSDateFromExcel from './get-js-date-from-excel.js';
import {timeFormat} from 'd3';

function clickTrack(){
    try{
        const uniquePhrase = "Strangulations map click or slide";
        s.linkTrackVars = "server,prop3,prop20,prop28,prop33,prop34,prop57,eVar3,eVar20,eVar21,eVar34,eVar35,eVar36,eVar37,eVar38,eVar39,eVar51";
        s.linkTrackEvents = "";
        s.prop57 = uniquePhrase;
        s.tl(
           // Since we're not actually tracking a link click, use true instead of `this`.  This also supresses a delay
           true,
           // linkType, 'o' for custom link
           'o',
           // linkName
            uniquePhrase,
           // variableOverrides
           null
        );
    }
    catch (ReferenceError){
        console.warn('You must be running this locally. *OR* Omniture is not loaded. Skipping analytics.');
    }

}

String.prototype.toSentenceCase = function(){
	// returns string in sentence case (lower, except for first char)
	let retval = this.toLowerCase();
	if (this.length < 2) return this.toUpperCase(); // For single- or no-character strings
	return retval[0].toUpperCase() + retval.slice(1);
}

String.prototype.toTitleCase = function(){
	// returns string in title case (Every word capitalized)
	const words_arr = this.split(' '),
		doNotCap = ["a", "an", "the", "aka", "AKA", "and", "but", "or", "for", "nor", "etc.", "on", "at", "to", "from", "by", "with"];

	let retval="";

	words_arr.forEach(word => {
		if (doNotCap.indexOf(word) > -1){
			retval += word + " ";
		} else {
			retval += word.toSentenceCase() + " ";
		}
	})
	return retval;
}

function useThisVictim(v){
	// Validate each vic for use on the map. Right now, we just need to confirm coordiantes.
	if (v.OCC_LAT != undefined && v.OCC_LNG != undefined) return true;
	return false
}

function formatDate(d, formatString){
	/*
		Takes a datetime object and formats it. 
		It then seeks poorly abbreviated months 
		and replaces them with AP style
	*/
	
	const 	date_obj = getJSDateFromExcel(d),
			month = date_obj.getMonth();

	let retval = timeFormat(formatString)(date_obj);
	switch (month){
		case 0:
			return retval.replace('Jan ', 'Jan. ')
			break;
		case 1:
			return retval.replace('Feb ', 'Feb. ')
			break;
		case 2:
			return retval.replace('Mar ', 'March ')
			break;
		case 3:
			return retval.replace('Apr ', 'April ')
			break;
		// case 4:
		// 	return retval.replace('May ', 'Jan. ')
		// 	break;
		case 5:
			return retval.replace('Jun ', 'June ')
			break;
		case 6:
			return retval.replace('Jul ', 'July ')
			break;
		case 7:
			return retval.replace('Aug ', 'Aug. ')
			break;
		case 8:
			return retval.replace('Sep ', 'Sept. ')
			break;
		case 9:
			return retval.replace('Oct ', 'Oct. ')
			break;
		case 10:
			return retval.replace('Nov ', 'Nov. ')
			break;
		case 11:
			return retval.replace('Dec ', 'Dec. ')
			break;
	}
	return retval;
}
function generateFoundSentence(v){

	// Takes the data and crafts a "she was found naked in a ..." sentence
	let retval = `<strong>${v.NAME.trim().toTitleCase()}</strong> was found `;

	if (v.PLACE) retval += ` <strong>${v.PLACE}</strong>`;
	retval += ". "
	return retval;
}


function generateVictimPopup(v){
	let retval="<p>" + generateFoundSentence(v);
	if (v.DATE && v.AGE) retval += `She died <strong>${formatDate(v.DATE, "%b %-d, %Y")},</strong> at age <strong>${v.AGE}</strong>.</p>`;
	if (v.CLOSED) retval += `<p><strong>Case closed:</strong> ${v.CLOSED.toSentenceCase()}</p>`;	

	return retval;
}

function getVictimIcon(v){
	// Return the desired style for the icon
	// At present, there is no conditional styling, 
	// but we're requiring the v object just in case.

	const 	caseClosedColor = getTribColor('trib-orange'),
			caseOpenColor = getTribColor('trib-red2');

	return {
		stroke: false,
		fill: true,
		fillColor: v.CLOSED.toUpperCase() == "YES" ? caseClosedColor : caseOpenColor,
		fillOpacity: .7,
		radius: 5
	};
}


function restyleVictimMarkers(victimMarkers, o=1, r=5){	
	// takes a marker set and restyles all markers therein with specified styles

	victimMarkers.eachLayer( l => {
		l.setStyle({
			fillOpacity:o,
			radius: r
		});
	});	
}

module.exports = function drawVictimsMap(container, data){
	// draw the map.
	let map = L.map(container,
		{
			zoom: window.innerWidth < window.desktopMinWidth ? 9 : 10,
			center: window.innerWidth < window.desktopMinWidth ? [41.862013, -87.680716] : [41.825, -87.5], // Move off center when on desktop
			scrollWheelZoom: false,
			minZoom: 9,
			maxZoom: 16,
		    renderer: L.canvas({padding:.05}), // You'll thank me for this when we start plotting dots
			// maxBounds:L.latLngBounds([42.029693, -87.969885],[41.603010, -87.466239]) // Limit map to, roughly, the Cook County boundary. No getting lost on the map here.
		}
	);

	L.tileLayer.provider('CartoDB.Positron').addTo(map);

	// ADDS CITY MASK
	L.tileLayer( "http://media.apps.chicagotribune.com/maptiles/chicago-mask/{z}/{x}/{y}.png", { 
		maxZoom: 16, 
		minZoom: 9, 
		opacity: 0.5 
	}).addTo(map);

	const 	victimMarkers = L.featureGroup({}),
			masterVictimMarkers = L.featureGroup({});

	data.forEach(v => {
		// V FOR VICTIM
		if (useThisVictim(v)){
			//customPopup goes here
			var customPopup = generateVictimPopup(v);

			const vMarker = L.circleMarker({
				lat:parseFloat(v.OCC_LAT),
				lng:parseFloat(v.OCC_LNG)
			}, getVictimIcon(v))
			.bindPopup(customPopup);

			if (v.DATE) vMarker.year = getJSDateFromExcel(v.DATE).getFullYear();

			vMarker.addTo(victimMarkers);
			vMarker.addTo(masterVictimMarkers);

		}
	});
	victimMarkers.addTo(map);


	// We want to tweak the style of the markers. By default they are small 
	// and mostly transparent, but as the map zooms in, we want them to be 
	// bigger/bolder/more visible.

	map.on('zoomend', e => {
		const currentZoom = map.getZoom();
		if (currentZoom >= 14){
			// all the way in
			restyleVictimMarkers(masterVictimMarkers, .9, 14)
		} else if (currentZoom >= 12){
			// getting closer
			restyleVictimMarkers(masterVictimMarkers, .6, 12)
		} else {
			// default
			restyleVictimMarkers(masterVictimMarkers, .55, 6)
		}
	});

	document.querySelector('#year-slider').addEventListener('input', function(e){
		// This powers the filter slider		
		const chosenYear = this.value < 2001 ? "All years" : Math.floor(this.value,0);
		
		if (document.querySelector('.bar--active') != null){
			// remove highlight from bars in the chart
			document.querySelector('.bar--active').classList.remove('bar--active');
		}

		// Add/remove relevant markers from map
		if(chosenYear == "All years"){
			masterVictimMarkers.eachLayer( l => {
				l.addTo(victimMarkers)
			});
		} else {
			// highlight the corresponding bar in the chart
			document.querySelector(`.bar--${chosenYear}`).classList.add('bar--active');
			masterVictimMarkers.eachLayer( l => {
				if (l.year == chosenYear){
					l.addTo(victimMarkers)
				} else {
					l.removeFrom(victimMarkers);
				}
			});	
			try{
				// Move the map to show all relevant markers
				map.fitBounds(victimMarkers.getBounds());
			}
			catch(e){
				// do nothing.
			}
		}
	});

	// If the slider has stopped sliding, link track
	document.querySelector('#year-slider').addEventListener('change', clickTrack);
	
	// If a popup opens, link track
	map.addEventListener('popupopen', clickTrack)


}