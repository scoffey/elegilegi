var projectIds = null;
var representatives = null;
var currentProject = null;
var results = null;
var votes = {};
var projectData = {};

var projects = [
	'ley-2095',
	'ley-2265',
	'ley-2801',
	'ley-2894',
	'ley-2930',
	'ley-2972',
	'ley-2992',
	'ley-3060',
	'ley-3947',
	'ley-4039',
	'ley-4109',
	'ley-4110',
	'ley-4113',
	'ley-4114',
	'ley-4315',
	'ley-4318',
	'ley-4352',
	'ley-4467',
	'ley-4471',
	'ley-4472',
	'ley-4565',
	'ley-4631'
];

function shuffle(array) {
	var counter = array.length, temp, index;

	while (counter > 0) {
		index = (Math.random() * counter--) | 0;
		temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}

function reset() {
	currentProject = null;
	results = {};
	votes = {};
	projectIds = shuffle(projects.slice(0));
	$('#intro').css('display', 'block');
	$('#about').css('display', 'none');
	$('#voting').css('display', 'none');
	$('#results').css('display', 'none');
}

function loadRandomProject() {
	currentProject = null;
	if (projectIds.length == 0) {
		finish();
		return;
	}
	var id = projectIds.pop();
	$.getJSON('data/' + id + '.json', function (data) {
		currentProject = data;
		currentProject.id = id;
		projectData[id] = data;
		$('#project').text(data.nombre);
		$('#summary').text(data.sumario);
		$('#date').text(data.fecha);// + ' - ' + data.asunto);
		$('#voting').fadeIn(100);
		var n = projects.length;
		var i = n - projectIds.length - 1;
		var p = Math.round(i * 100 / n);
		$('#progress-bar span').css('width', p + '%');
		$('#progress-status').text('Completado: ' + i + ' / ' + n);
	});
}

function vote(choice) {
	var voting = currentProject.votacion;
	if (!voting) return;
	votes[currentProject.id] = choice;
	voteHelper(voting.AFIRMATIVO, (choice == 'Y'));
	voteHelper(voting.NEGATIVO, (choice == 'N'));
	voteHelper(voting.ABSTENCION, (choice == 'A'));
	voteHelper(voting.AUSENTE, (choice == '0'));
}

function voteHelper(keys, coinciding) {
	if (!keys) return;
	for (var i = 0; i < keys.length; i++) {
		var k = keys[i];
		if (!(results[k])) {
			results[k] = $.extend({
				coincidences: 0,
				discrepancies: 0,
			}, representatives[k] || {'nombre': k, 'bloque': ''});
		}
		if (coinciding) {
			results[k].coincidences += 1;
		} else {
			results[k].discrepancies += 1;
		}
	}
}

function showTooltip(e) {
	var id = e.target.parentNode.getAttribute('id');
	var c = $('<ul></ul>');
	var d = $('<ul></ul>');
	var li = null;
	for (var i in projectData) {
		var v = projectData[i].votacion;
		var vote = votes[i];
		if (!v || !vote) continue;
		var n = projectData[i].nombre;
		if (v.AFIRMATIVO && v.AFIRMATIVO.indexOf(id) != -1) {
			li = $('<li></li>').text(n + ' (SI)');
			if (vote == 'Y') c.append(li); else d.append(li);
		}
		if (v.NEGATIVO && v.NEGATIVO.indexOf(id) != -1) {
			li = $('<li></li>').text(n + ' (NO)');
			if (vote == 'N') c.append(li); else d.append(li);
		}
		if (v.ABSTENCION && v.ABSTENCION.indexOf(id) != -1) {
			li = $('<li></li>').text(n + ' (ABSTENCION)');
			if (vote == 'A') c.append(li); else d.append(li);
		}
		if (v.AUSENTE && v.AUSENTE.indexOf(id) != -1) {
			li = $('<li></li>').text(n + ' (AUSENTE)');
			if (vote == '0') c.append(li); else d.append(li);
		}
	}
	var tooltip = getTooltip().finish().empty();
	var b = {'font-weight': 'bold'};
	tooltip.append($('<p></p>').css(b).text('Coincidencias:'));
	tooltip.append(c);
	tooltip.append($('<p></p>').css(b).text('Discrepancias:'));
	tooltip.append(d);
	var offset = $(e.target).offset();
	tooltip.css({
		'top': (offset.top) + 'px',
		'left': (offset.left - tooltip.width() - 15) + 'px'
	}).fadeIn(200);
}

function hideTooltip() {
	getTooltip().finish().fadeOut(500);
}

function getTooltip() {
	if (!document.getElementById('tooltip')) { // singleton
		var e = document.createElement('div');
		e.setAttribute('id', 'tooltip');
		$('body').append(e);
		$(e).addClass('tooltip');
	}
	return $('#tooltip');
}

function printResults(callback) {
	var rows = $('#rows');
	rows.empty();
	var tuples = sortResults(callback);
	for (var i = 0; i < tuples.length; i++) {
		var r = tuples[i];
		var tr = document.createElement('tr');
		$(tr).attr('id', r.id);

		var td = document.createElement('td');
		var span = document.createElement('span');
		$(span).text(r.nombre);
		$(td).append(span);
		$(td).append(document.createElement('br'));
		var info = document.createElement('span');
		$(info).text(r.bloque);
		//$(info).text(r.bloque + ' (' + r.distrito + ')');
		$(info).addClass('shady');
		$(td).append(info);
		tr.appendChild(td);

		printResultsHelper(tr, r.chance + '%');
		printResultsHelper(tr, r.participation + '%');
		printResultsHelper(tr, r.coincidences)
			.on('mouseover', showTooltip)
			.on('mouseout', hideTooltip);
		printResultsHelper(tr, r.discrepancies)
			.on('mouseover', showTooltip)
			.on('mouseout', hideTooltip);
		printResultsHelper(tr, r.difference)
			.on('mouseover', showTooltip)
			.on('mouseout', hideTooltip);
		rows.append(tr);
	}
	render(tuples);
}

function printResultsHelper(tr, text) {
	var td = document.createElement('td');
	var e = $(td);
	e.text(text).addClass('center');
	tr.appendChild(td);
	return e;
}

function sortResults(callback) {
	var tuples = new Array();
	var province = $('#province').val();
	var totalVotes = 0;
	for (var i in votes) {
		totalVotes++;
	}
	for (var i in results) {
		var r = results[i];
		if (province && province != r.distrito) continue;
		var total = r.coincidences + r.discrepancies;
		r.id = i;
		r.difference = r.coincidences - r.discrepancies;
		r.chance = Math.round(r.coincidences * 100 / total);
		r.participation = Math.round(total * 100 / totalVotes)
		tuples.push(r);
	}
	tuples.sort(callback);
	return tuples;
}

function sortByName(a, b) {
	return a.nombre.localeCompare(b.nombre);
}

function sortByChance(a, b) {
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
}

function sortByDifference(a, b) {
	var d = b.difference - a.difference; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
}

function sortByCoincidences(a, b) {
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
}

function sortByDiscrepancies(a, b) {
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
}

function sortByParticipation(a, b) {
	var d = b.participation - a.participation; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
}

function finish() {
	printResults(sortByDifference);
	$('#voting').stop(true);
	$('#voting').fadeOut(200, function () {
		$('#results').fadeIn(100);
	});
}

function initFilters(options) {
	if (document.getElementById('province').options.length > 0) return;
	$('#province').empty();
	items = [];
	for (var i in options) { items.push(i); }
	items.sort();
	for (var i = 0; i < items.length; i++) {
		var s = items[i];
		var option = $('<option></option>').attr('value', s).text(s);
		$('#province').append(option);
	}
	var option = $('<option></option>').attr('value', '')
			.attr('selected', 'selected').text('(Todos)');
	$('#province').append(option);
}

function shareOnFacebook() {
	window.open('https://www.facebook.com/sharer/sharer.php?u='
		+ encodeURIComponent(location.href),
		'facebook-share-dialog', 'width=626,height=436');
}

function shareOnTwitter() {
	var tweet = '\u00bfNo sab\u00e9s a qui\u00e9n votar? '
		+ 'Prob\u00e1 este juego para elegir legisladores '
		+ 'que votan como vos: ';
	window.open('http://twitter.com/intent/tweet?text='
		+ encodeURIComponent(tweet) + '&url='
		+ encodeURIComponent(location.href)
		+ '&hashtags=opengov,elegilegi',
		'twitter-share-dialog', 'width=550,height=420');
}

function shareOnGooglePlus() {
	window.open('https://plus.google.com/share?url='
		+ encodeURIComponent(location.href),
		'google-share-dialog', 'width=600,height=600');
}

$(document).ready(function () {
	$(document).ajaxError(function (evnt, jqxhr, options, e) {
		alert('Error al cargar datos de: ' + options.url
			+ '\n\n' + JSON.stringify(jqxhr, null, 2)
			+ '\n\nPor favor, recarg\u00e1 la p\u00e1gina.');
	});

	$.getJSON('legisladores.json', function (data) {
		representatives = data;
		$('#start').click(function () {
			$('#intro').fadeOut(200, loadRandomProject);
		});
		var options = {};
		for (var i in representatives) {
			var r = representatives[i];
			options[r.distrito] = true;
		}
		//initFilters(options);
	});

	$('#vote-aye').click(function () {
		if (!currentProject) return;
		vote('Y');
		$('#voting').fadeOut(200, loadRandomProject);
	});
	$('#vote-nay').click(function () {
		if (!currentProject) return;
		vote('N');
		$('#voting').fadeOut(200, loadRandomProject);
	});
	$('#vote-abstention').click(function () {
		if (!currentProject) return;
		vote('A');
		$('#voting').fadeOut(200, loadRandomProject);
	});
	$('#vote-absentee').click(function () {
		if (!currentProject) return;
		vote('0');
		$('#voting').fadeOut(200, loadRandomProject);
	});
	$('#vote-skip').click(function () {
		if (!currentProject) return;
		$('#voting').fadeOut(200, loadRandomProject);
	});

	$('.facebook').click(shareOnFacebook);
	$('.twitter').click(shareOnTwitter);
	$('.googleplus').click(shareOnGooglePlus);

	$('#name').click(function () {
		printResults(sortByName);
	});
	$('#chance').click(function () {
		printResults(sortByChance);
	});
	$('#participation').click(function () {
		printResults(sortByParticipation);
	});
	$('#coincidences').click(function () {
		printResults(sortByCoincidences);
	});
	$('#discrepancies').click(function () {
		printResults(sortByDiscrepancies);
	});
	$('#difference').click(function () {
		printResults(sortByDifference);
	});

	$('#province').click(function () {
		printResults(sortByDifference);
		$('html, body').animate({'scrollTop': 0}, 'slow');
	});

	$('#link').click(function () {
		if (currentProject) window.open(currentProject.url, '_blank');
	});
	$('#info').click(function () { $('#about').slideToggle(500); });
	$('#back').click(function () { $('#about').slideToggle(500); });
	$('#reset').click(reset);
	reset();
});

function truncate(s, maxlen) {
	return (s.length > maxlen ? s.substr(0, maxlen - 3) + '...' : s);
}

function render(data) {

$('#chart').empty();

var margin = {top: 20, right: 20, bottom: 30 + 140, left: 40},
    width = 720 - margin.left - margin.right,
    height = 640 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category20c();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain(d3.extent(data, function(d) { return d.participation; })).nice();
  y.domain(d3.extent(data, function(d) { return d.chance; })).nice();

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Participaci\u00f3n (%)");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Chance de coincidir (%)");

var div = d3.select("body").append("div")
    .attr("class", "chart-tooltip")
    .style("opacity", 0);

  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3)
      .attr("cx", function(d) { return x(d.participation + 4 * Math.random() - 2); })
      .attr("cy", function(d) { return y(d.chance + 4 * Math.random() - 2); })
      .style("fill", function(d) { return color(d.bloque); })
      .on("mouseover", function (d) {
        div.transition()
                .duration(200)
                .style("opacity", .9);
        div.html(d.nombre + ' (' + truncate(d.bloque, 30) + ')')
                .style("left", (d3.event.pageX + 2) + "px")
                .style("top", (d3.event.pageY - 36) + "px");
      }).on("mouseout", function(d) {
        div.transition()
                .duration(500)
                .style("opacity", 0);
      });

  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (i % 4) * 165 + "," + Math.floor(i / 4) * 12 + ")"; });

  legend.append("rect")
      .attr("y", height + 40)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", color);

  legend.append("text")
      .attr("x", 12)
      .attr("y", height + 5 + 40)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(function(d) { return truncate(d, 30); });

}
