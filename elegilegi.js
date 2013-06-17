var asuntos = null;
var projectIds = null;
var voting = null;
var representatives = {};

function display(id) {
	$('#intro').css('display', (id == 'intro' ? 'block' : 'none'));
	$('#voting').css('display', (id == 'voting' ? 'block' : 'none'));
	$('#results').css('display', (id == 'results' ? 'block' : 'none'));
}

function reset() {
	voting = null;
	representatives = {};
	$.getJSON('data/asuntos.json', function (data) {
		asuntos = data;
		projectIds = Object.keys(data);
		loadRandomProject();
	});
	display('intro');
}

function loadRandomProject() {
	voting = null;
	var i = Math.floor(Math.random() * projectIds.length);
	var id = projectIds[i];
	projectIds.splice(i, 1);
	$('#project').text(asuntos[id].asunto);
	$('#date').text(asuntos[id].fecha);
	$.getJSON('data/' + id + '.json', function (data) {
		voting = data;
	});
}

function match(reps) {
	if (!reps) return;
	for (var i = 0; i < reps.length; i++) {
		var r = reps[i];
		if (representatives[r.diputado]) {
			representatives[r.diputado].coincidencias += 1;
		} else {
			representatives[r.diputado] = r;
			representatives[r.diputado].coincidencias = 1;
		}
	}
}

$('#vote-aye').click(function () {
	if (!voting) return;
	$('#voting').fadeOut(200, function () {
		match(voting.AFIRMATIVO);
		loadRandomProject();
	}).fadeIn(100);
});
$('#vote-nay').click(function () {
	if (!voting) return;
	$('#voting').fadeOut(200, function () {
		match(voting.NEGATIVO);
		loadRandomProject();
	}).fadeIn(100);
});
$('#vote-abs').click(function () {
	if (!voting) return;
	$('#voting').fadeOut(200, function () {
		loadRandomProject();
	}).fadeIn(100);
});

$('#finish').click(function () {
	var results = new Array();
	for (var i in representatives) {
		var r = representatives[i];
		var n = r.coincidencias;
		if (!(results[n])) {
			results[n] = new Array();
		}
		results[n].push(r);
	}
	$('#reps').empty();
	for (var i = results.length - 1; i >= 0; i--) {
		var a = results[i];
		for (var j = 0; j < a.length; j++) {
			var e = document.createElement('li');
			$(e).text(a[j].diputado + ' ('
				+ a[j].bloque + ') '
				+ a[j].distrito + ' ['
				+ a[j].coincidencias + ']');
			$('#reps').append(e);
		}
		break; // only show top matches -- TODO
	}
	display('results');
});

$('#start').click(function () { display('voting'); });
$('#back').click(function () { display('intro'); });
$('#resume').click(function () { display('voting'); });
$('#reset').click(reset);
$('#about-trigger').click(function () { $('#about').toggleClass('active'); });
$('#about-close').click(function () { $('#about').toggleClass('active'); });

$(document).ready(reset);
