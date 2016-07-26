function CSVToMap(rawData) {
	var arr = CSVToArray(rawData);
	var map = {};
	var isCompositeKey = false;
	for (var i = 1; i < arr.length; i++) {
		var row = arr[i];
		var item = {};
		for (var j = 0; j < row.length; j++) {
			item[arr[0][j]] = row[j];
		}
		if (map[row[0]]) {
			if (!isCompositeKey) {
				isCompositeKey = true;
				var swap = map[row[0]];
				map[row[0]] = {};
				map[row[0]][swap[arr[0][1]]] = swap;
			}
			map[row[0]][row[1]] = item;
		} else {
			if (isCompositeKey) {
				var tmp = {};
				tmp[row[1]] = item;
				item = tmp;
			}
			map[row[0]] = item;
		}
	}
	return map;
}

var elegilegi = {};
elegilegi.data = {};
elegilegi.load = function (key) {
	$.ajax({
		'type': 'GET',
		'url': 'scripts/' + key + '.csv',
		'dataType': 'text',
		'success': function (rawData) {
			elegilegi.data[key] = CSVToMap(rawData);
		}
	});
};
elegilegi.projects = {};
elegilegi.userId = null;
elegilegi.sortingCallbacks = {};
elegilegi.currentGame = null;

function Game() {
	this.projectCount = 0;
	this.projectIds = [];
	this.currentProject = null;
	this.votes = {};
	this.results = {};
}

elegilegi.projectIds = [

	// 20 most important
	'26522',
	'26571',
	'26618',
	'26639',
	'26739',
	'26741',
	'26774',
	'26790',
	'26843',
	'26854',
	'26855',
	'26861',
	'26984',
	'26994',
	'27008',
	'27063',
	'27078',
	'27120',
	'27126',
	'27132',

	// + 20 = 40
	'26734',
	'26740',
	'26742',
	'26743',
	'26761',
	'26831',
	'26842',
	'26844',
	'26853',
	'26856',
	'26857',
	'26862',
	'26893',
	'26896',
	'26913',
	'26944',
	'26970',
	'26991',
	'26993',
	'27160'

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
	if (!elegilegi.currentGame) {
		$('html,body').animate({'scrollTop': 0}, 'slow');
	}
	elegilegi.currentGame = new Game();
	$('#intro').css('display', 'block');
	$('#about').css('display', 'none');
	$('#stats').css('display', 'none');
	$('#options').css('display', 'none');
	$('#voting').css('display', 'none');
	$('#results').css('display', 'none');
}

function startGame(n) {
	var g = elegilegi.currentGame;
	g.projectCount = n;
	g.projectIds = shuffle(elegilegi.projectIds.slice(0, n));
	$('#options').fadeOut(200, loadRandomProject);
}

function loadRandomProject() {
	var g = elegilegi.currentGame;
	if (g.projectIds.length == 0) {
		finish();
		return;
	}
	var id = g.projectIds.pop();
	var p = elegilegi.data.proyectos[id];
	p.id = id;
	elegilegi.projects[id] = p;
	g.currentProject = p;
	$('#project').text(p.nombre);
	$('#summary').text(p.sumario);
	$('#date').text(p.fecha);
	$('#voting').fadeIn(100);
	var n = g.projectCount;
	var i = n - g.projectIds.length - 1;
	var p = Math.round(i * 100 / n);
	$('#progress-bar span').css('width', p + '%');
	$('#progress-status').text('Completado: ' + i + ' / ' + n);
}

function getVoteHandler(choice) {
	return function () {
		var g = elegilegi.currentGame;
		var p = g.currentProject;
		g.currentProject = null; // don't vote same project again
		if (!p) return;
		var value = ["Y", "N", "A", "0"].indexOf(choice);
		g.votes[p.id] = choice;
		var vs = elegilegi.data['elegilegi-votaciones-diputados'];
		voteHelper(vs[p.asuntoD], value, 'diputados');
		var vs = elegilegi.data['elegilegi-votaciones-senado'];
		voteHelper(vs[p.asuntoS], value, 'senadores');
		$('#voting').fadeOut(200, loadRandomProject);
		if (ga) ga('send', 'event', 'game', 'vote', p.id, value);
	};
}

function voteHelper(vs, value, house) {
	if (!vs) return;
	var h = house == 'senadores' ? 'Senado' : 'Diputados';
	var s = 'bloques-' + h.toLowerCase();
	var g = elegilegi.currentGame;
	for (key in vs) {
		if (!(g.results[key])) {
			var r = elegilegi.data[house][key];
			var b = elegilegi.data[s][vs[key].bloqueId];
			g.results[key] = $.extend({
				id: r.diputadoId,
				camara: h,
				bloque: b.bloque,
				coincidences: 0,
				discrepancies: 0,
				difference: null,
				chance: null,
				participation: null
			}, r);
		}
		if (parseInt(vs[key].voto) == value) {
			g.results[key].coincidences += 1;
		} else {
			g.results[key].discrepancies += 1;
		}
	}
}

function showTooltip(e) {
	var id = e.target.parentNode.getAttribute('id');
	var c = $('<ul></ul>');
	var d = $('<ul></ul>');
	var li = null;
	var g = elegilegi.currentGame;
	for (var i in elegilegi.projects) {
		var p = elegilegi.projects[i];
		var v = p.votacion;
		var vote = g.votes[i];
		if (!v || !vote) continue;
		var n = p.nombre;
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

/*
function showMiniProfile(e) {
	var id = e.target.parentNode.getAttribute('id');
	var r = representatives[id];
	if (!r || !(r.foto || r.candidatura)) return;
	var miniprofile = getMiniProfile().finish().empty();
	if (r.foto) {
		var img = $(document.createElement('img')).attr(
			{'src': r.foto}).css({'float': 'right'});
		miniprofile.append(img);
	}
	var p = $(document.createElement('p')).text(r.nombre);
	miniprofile.append(p);
	if (r.candidatura) {
		var c = r.candidatura;
		var t = 'Candidato/a a ' + (c.camara == 'Senado'
			? 'Senador(a)' : 'Diputado/a') + ' #' + c.orden;
		var p = $(document.createElement('p')).addClass('shady');
		p.append($(document.createElement('span')).text(t));
		p.append(document.createElement('br'));
		p.append($(document.createElement('span')).text(c.lista));
		p.append(document.createElement('br'));
		p.append($(document.createElement('span')).text(c.distrito));
		miniprofile.append(p);
	}
	var offset = $(e.target).offset();
	miniprofile.css({
		'top': (offset.top) + 'px',
		'left': (offset.left + $(e.target).width() + 5) + 'px'
	}).fadeIn(200);
}

function hideMiniProfile() {
	getMiniProfile().finish().fadeOut(500);
}

function getMiniProfile() {
	if (!document.getElementById('miniprofile')) { // singleton
		var e = document.createElement('div');
		e.setAttribute('id', 'miniprofile');
		$('body').append(e);
		$(e).addClass('tooltip');
	}
	return $('#miniprofile');
}
*/

function printResults() {
	var rows = $('#rows');
	rows.empty();
	var tuples = sortResults();
	for (var i = 0; i < tuples.length; i++) {
		var r = tuples[i];
		var tr = document.createElement('tr');
		$(tr).attr('id', r.id);

		var td = document.createElement('td');
		var anchor = document.createElement(r.url ? 'a' : 'span');
		$(anchor).attr(r.url ? {'href': r.url, 'target': '_blank'}
			: {}).text(r.nombre);
		$(td).append(anchor);
		$(td).append(document.createElement('br'));
		var info = document.createElement('span');
		$(info).text(r.bloque + ' (' + r.distrito + ') - ' + r.camara);
		$(info).addClass('shady');
		$(td).append(info);
			//.on('mouseover', showMiniProfile)
			//.on('mouseout', hideMiniProfile);
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

function sortResults() {
	var g = elegilegi.currentGame;
	var tuples = new Array();
	var totalVotes = 0;
	for (var i in g.votes) {
		totalVotes++;
	}
	var district = $('#district').val();
	var house = $('#house').val();
	var relevance = parseInt($('#relevance').val());
	var order = $('#order').val();
	for (var i in g.results) {
		var r = g.results[i];
		var total = r.coincidences + r.discrepancies;
		r.difference = r.coincidences - r.discrepancies;
		r.chance = Math.round(r.coincidences * 100 / total);
		r.participation = Math.round(total * 100 / totalVotes)
		if (filterResult(r, district, house, relevance)) {
			tuples.push(r);
		}
	}
	var scbs = elegilegi.sortingCallbacks;
	tuples.sort(scbs[order] || scbs.difference);
	return tuples;
}

function filterResult(r, district, house, relevance) {
	if (district && r.distrito != district) return false;
	if (house && r.camara.indexOf(house) == -1) return false;
	if (relevance && r.participation < relevance) return false;
	return true;
}

elegilegi.sortingCallbacks.name = function (a, b) {
	return a.nombre.localeCompare(b.nombre);
};

elegilegi.sortingCallbacks.chance = function (a, b) {
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
};

elegilegi.sortingCallbacks.difference = function (a, b) {
	var d = b.difference - a.difference; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
};

elegilegi.sortingCallbacks.coincidences = function (a, b) {
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
};

elegilegi.sortingCallbacks.discrepancies = function (a, b) {
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.participation - a.participation; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
};

elegilegi.sortingCallbacks.participation = function (a, b) {
	var d = b.participation - a.participation; if (d) return d;
	var d = b.chance - a.chance; if (d) return d;
	var d = b.difference - a.difference; if (d) return d;
	var d = b.coincidences - a.coincidences; if (d) return d;
	var d = a.discrepancies - b.discrepancies; if (d) return d;
	return a.nombre.localeCompare(b.nombre);
};

function finish() {
	printResults();
	$('#voting').stop(true);
	$('#voting').fadeOut(200, function () {
		$('#results').fadeIn(100);
	});
	if (ga) {
		ga('set', 'dimension1', getStats('gender'));
		ga('set', 'dimension2', getStats('age'));
		ga('set', 'dimension3', getStats('education'));
		ga('set', 'dimension4', $('#party').val());
		ga('set', 'dimension5', $('#location').val());
		ga('send', 'pageview', '/#result');
	}
	var g = elegilegi.currentGame;
	var data = $.extend({'uuid': elegilegi.userId || '', 'segment': [
		getStats('gender'),
		getStats('age'),
		getStats('education'),
		$('#party').val(),
		$('#location').val()
	].join(',')}, g.votes);
	/*
	$.ajax('http://www.coffey.com.ar/elegilegi/api', {
		'dataType': 'jsonp',
		'data': data,
		'success': function (r) { elegilegi.userId = r.user_id; }
	});
	*/
}

function getStats(name) {
	return $('input[name="' + name + '"]:checked').val() || '';
}

function shareOnFacebook() {
	window.open('https://www.facebook.com/sharer/sharer.php?u='
		+ encodeURIComponent(location.href),
		'facebook-share-dialog', 'width=626,height=436');
}

function shareOnTwitter() {
	var tweet = '\u00bfNo sab\u00e9s a qui\u00e9n votar? '
		+ 'Jug\u00e1 a ser legislador y aprend\u00e9 qui\u00e9n te '
		+ 'representa mejor: ';
	window.open('http://twitter.com/intent/tweet?text='
		+ encodeURIComponent(tweet) + '&url='
		+ encodeURIComponent(location.href)
		+ '&hashtags=elegilegi,Elecciones2015',
		'twitter-share-dialog', 'width=550,height=420');
}

function shareOnGooglePlus() {
	window.open('https://plus.google.com/share?url='
		+ encodeURIComponent(location.href),
		'google-share-dialog', 'width=600,height=600');
}

function shareOnWhatsApp() {
	if (!isMobile()) {
		window.open('https://web.whatsapp.com/', '_blank');
		return;
	}
	var text = '\u00bfNo sab\u00e9s a qui\u00e9n votar? '
		+ 'Jug\u00e1 a ser legislador y aprend\u00e9 qui\u00e9n te '
		+ 'representa mejor: ' + location.href;
	window.open('whatsapp://send?text=' + encodeURIComponent(text));
}

function isMobile() {
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
}

$(document).ready(function () {
	elegilegi.load('proyectos');
	elegilegi.load('diputados');
	elegilegi.load('senadores');
	elegilegi.load('bloques-diputados');
	elegilegi.load('bloques-senado');
	elegilegi.load('elegilegi-votaciones-diputados');
	elegilegi.load('elegilegi-votaciones-senado');
	// TODO: only set the following event handler when all data is loaded
	$('#start').click(function () {
		$('#intro').fadeOut(200, function () {
			//$('#stats').fadeIn(100);
			$('#options').fadeIn(100);
		});
	});

	$(document).ajaxError(function (evnt, jqxhr, options, e) {
		alert('Error al cargar datos de: ' + options.url
			+ '\n\n' + JSON.stringify(jqxhr, null, 2)
			+ '\n\nPor favor, recarg\u00e1 la p\u00e1gina.');
	});

	$('#continue').click(function () {
		$('#stats').fadeOut(200, function () {
			$('#options').fadeIn(100);
		});
	});

	$('#fast').click(function () { startGame(20); });
	$('#full').click(function () { startGame(40); });

	$('#vote-aye').click(getVoteHandler('Y'));
	$('#vote-nay').click(getVoteHandler('N'));
	$('#vote-abstention').click(getVoteHandler('A'));
	$('#vote-absentee').click(getVoteHandler('0'));
	$('#vote-skip').click(function () {
		var p = elegilegi.currentGame.currentProject;
		if (p) $('#voting').fadeOut(200, loadRandomProject);
	});

	$('.facebook').click(shareOnFacebook);
	$('.twitter').click(shareOnTwitter);
	$('.googleplus').click(shareOnGooglePlus);
	$('.whatsapp').click(shareOnWhatsApp);

	$('#district').change(printResults);
	$('#house').change(printResults);
	$('#relevance').change(printResults);
	$('#order').change(printResults);

	$('#name').click(function () {
		$('#order').val('name');
		printResults();
	});
	$('#chance').click(function () {
		$('#order').val('chance');
		printResults();
	});
	$('#participation').click(function () {
		$('#order').val('participation');
		printResults();
	});
	$('#coincidences').click(function () {
		$('#order').val('coincidences');
		printResults();
	});
	$('#discrepancies').click(function () {
		$('#order').val('discrepancies');
		printResults();
	});
	$('#difference').click(function () {
		$('#order').val('difference');
		printResults();
	});

	$('#link').click(function () {
		var p = elegilegi.currentGame.currentProject;
		if (p) window.open(p.url, '_blank');
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
if (window.innerWidth < 850) return;

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







// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}
