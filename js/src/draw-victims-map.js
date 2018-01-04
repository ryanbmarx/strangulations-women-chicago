import * as L from "leaflet";
import "leaflet-providers";
import getTribColor from './getTribColors.js';
import getJSDateFromExcel from './get-js-date-from-excel.js';
import {timeFormat} from 'd3';

String.prototype.toSentenceCase = function(){
	// returns string in sentence case (lower, except for first char)
	let retval = this.toLowerCase();
	if (this.length < 2) return this.toUpperCase(); // For single- or no-character strings
	return retval[0].toUpperCase() + retval.slice(1);
}

String.prototype.toTitleCase = function(){
	// returns string in title case (Every word capitalized)
	const words_arr = this.split(' '),
		doNotCap = ["a", "an", "the", "and", "but", "or", "for", "nor", "etc.", "on", "at", "to", "from", "by", "with"];

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
	// console.log(v, " is false");
	return false
}

function formatDate(d, formatString){
	const date_obj = getJSDateFromExcel(d);
	return timeFormat(formatString)(date_obj);
}
function generateFoundSenetence(v){

	// Takes the data and crafts a "she was found naked in a ..." sentence
	let retval = `<p class='popup__name'><strong>${v.NAME.trim().toTitleCase()}</strong> was found <strong>`;

	if (v.CLOTHED) {
		if (v.CLOTHED.toUpperCase() == "YES") retval += "fully clothed";
		else if (v.CLOTHED.toUpperCase() == "NAKED") retval += "naked";
		else retval += "partially clothed";
		
		retval += "</strong>";
	}
	// console.log(v)

	if (v.PLACE) retval += ` ${v.PLACE}`;
	retval += ".</p>"
	return retval;
}


function generateVictimPopup(v){
	let retval=generateFoundSenetence(v);
	// if (v.NAME) retval += `<p><strong>${v.NAME.trim().toTitleCase()}</strong></p>`;
	if (v.DATE && v.AGE) retval += `<p class='popup__died'>She died <strong>${formatDate(v.DATE, "%b %-d, %Y ")}</strong> at age <strong>${v.AGE}</strong>.</p>`;
	// if (v.AGE) retval += `<p><strong>Age:</strong> </p>`;
	if (v.CLOSED) retval += `<p><strong>Case closed:</strong> ${v.CLOSED.toSentenceCase()}</p>`;

	// if (v.RACE) retval += `<p>Race: ${v.RACE.toTitleCase()}</p>`;
	

	return retval;
}

function getVictimIcon(v){
	// Return the desired style for the icon
	// At present, there is no conditional styling, 
	// but we're requiring the v object just in case.

	const 	caseClosedColor = getTribColor('trib-red2'),
			caseOpenColor = getTribColor('trib-orange');

	return {
		stroke: false,
		fill: true,
		fillColor: v.CLOSED.toUpperCase() == "YES" ? caseClosedColor : caseOpenColor,
		fillOpacity: .7,
		radius: 5
	};
}


function restyleVictimMarkers(victimMarkers, o=1, r=5){	
	victimMarkers.eachLayer( l => {
		l.setStyle({
			fillOpacity:o,
			radius: r
		});
	});	
}
module.exports = function drawVictimsMap(container, data){
	// draw the map.
	console.log(data)

	let map = L.map(container,
		{
			zoom: 10,
			center: [41.862013, -87.680716],
			scrollWheelZoom: false,
			minZoom: 10,
			maxZoom: 16,
		    renderer: L.canvas({padding:.05}), // You'll thank me for this when we start plotting dots
			// maxBounds:L.latLngBounds([42.029693, -87.969885],[41.603010, -87.466239]) // Limit map to, roughly, the Cook County boundary. No getting lost on the map here.
		}
	);

	L.tileLayer.provider('Stamen.TonerLite').addTo(map);

	// ADDS CITY MASK
	L.tileLayer( "http://media.apps.chicagotribune.com/maptiles/chicago-mask/{z}/{x}/{y}.png", { 
		maxZoom: 16, 
		minZoom: 10, 
		opacity: 0.5 
	}).addTo(map);

	const 	victimMarkers = L.layerGroup({}),
			masterVictimMarkers = L.layerGroup({});


	// data.sort(d => d.DATE);

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
			restyleVictimMarkers(victimMarkers, .9, 14)
		} else if (currentZoom >= 12){
			// getting closer
			restyleVictimMarkers(victimMarkers, .6, 12)
		} else {
			// default
			restyleVictimMarkers(victimMarkers, .55, 6)
		}
	});


	document.querySelector('#year-slider').addEventListener('change', function(e){
		
		const chosenYear = this.value < 2001 ? "All years" : this.value;

		// console.log(chosenYear)
		// document.querySelector('#chosen-year').innerHTML = chosenYear;

		// const sliderPos = (this.value - this.min) / (this.max - this.min),
		// pixelPostion = this.clientWidth * sliderPos;
		//this is your pixel value
		// document.querySelector('#chosen-year').setAttribute('style', `left:${sliderPos * 100}%`);
		// console.log(pixelPostion);
		
		if(chosenYear == "All years"){
			console.log('show all')
			masterVictimMarkers.eachLayer( l => {
				l.addTo(victimMarkers)
			});
		} else {
			masterVictimMarkers.eachLayer( l => {
				if (l.year == chosenYear){
					l.addTo(victimMarkers)
				} else {
					l.removeFrom(victimMarkers);
				}
			});	
		}
	})

}