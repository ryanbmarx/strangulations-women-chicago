import drawVictimsMap from './draw-victims-map.js'
import BarChart from './bar-chart.js';
import getJSDateFromExcel from './get-js-date-from-excel.js';
import countBy from "lodash.countby";



window.addEventListener('load', function(e){
	drawVictimsMap(document.querySelector('#map'), window.victims);

	let histoData = [];
	window.victims.forEach(v => {
		if (v.DATE) histoData.push(getJSDateFromExcel(v.DATE).getFullYear());
	});

	histoData = countBy(histoData, o => o);

	let histoData_arr = [];

	Object.keys(histoData).forEach(y => {
		histoData_arr.push({
			year: parseInt(y),
			deaths: histoData[y]
		})
	})

	histoData_arr.push({year: 2015, deaths:0})
	histoData_arr.push({year: 2016, deaths:0})

	histoData_arr.sort((a,b) => a.year - b.year);
	function yearFormat(year){
        if(document.querySelector('.histogram').getBoundingClientRect().width < 450){
			if (year % 2 != 0) {
				let retval = year.toString();
				return `'${retval.slice(2)}`;
			}			
		} else {
			let retval = year.toString();
			return `'${retval.slice(2)}`;
		}


	}
	const bbox = document.querySelector('.histogram').getBoundingClientRect()
	const histogram = new BarChart({
        container: document.querySelector('.histogram'),
        dataset: histoData_arr, // Will be charted AS IS. All transforms, etc., should be done by now.
        xAttribute:'year', // The key of the x attribute in the data set
        yAttribute:'deaths', // The key of the y attribute in the data set
        innerMargins:{ top:0,right:0,bottom:15,left:(bbox.width / 18) }, // This will inset the chart from the base container (which should be controlled by CSS)
        barFillColor:"#aaa", // must be a valid color syntax, #HEX, rgba(), etc.
        axisFormatter: {
        	// These strings will be used with d3.format(<string>)(<number>) on the axes 
            yAxis: false,
            xAxis: yearFormat
        },
        xMin: false,
        xMax: false,
        yMin:false, // Most charts should start at zero
        yMax: false,
        showYAxis:true,
        showXAxis:true,
        removeXAxisDomain: true,
        removeXAxisTickMarks: true,
        removeYAxisDomain: true,
        removeYAxisTickMarks: document.querySelector('.histogram').getBoundingClientRect().width < 450 ? true : false,
        ticks:{
            yAxis:3,
            xAxis: histoData_arr.length
        },
        meta:{
            headline:false,
            xAxisLabel: false,
            yAxisLabel: false,
            sources: false,
            credit: false
        }
    });



})