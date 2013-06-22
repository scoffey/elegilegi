var projectIds = null;
var representatives = null;
var currentProject = null;
var currentVotes = null;

function display(id) {
	$('#intro').css('display', (id == 'intro' ? 'block' : 'none'));
	$('#about').css('display', (id == 'about' ? 'block' : 'none'));
	$('#voting').css('display', (id == 'voting' ? 'block' : 'none'));
	$('#results').css('display', (id == 'results' ? 'block' : 'none'));
}

function reset() {
	currentProject = null;
	currentVotes = {};
	$.getJSON('data/index.json', function (data) {
		projectIds = data;
		loadRandomProject();
	});
	$.getJSON('data/legisladores.json', function (data) {
		representatives = data;
	});
	display('intro');
}

function loadRandomProject() {
	currentProject = null;
	var i = Math.floor(Math.random() * projectIds.length);
	var id = projectIds[i];
	projectIds.splice(i, 1);
	$('#project').text('');
	$('#date').text('');
	$.getJSON('data/proyectos/' + id + '.json', function (data) {
		currentProject = data;
		$('#project').text(data.asunto);
		$('#date').text(data.fecha);
	});
}

function match(reps) {
	if (!reps) return;
	for (var i = 0; i < reps.length; i++) {
		var r = reps[i];
		if (currentVotes[r]) {
			currentVotes[r] += 1;
		} else {
			currentVotes[r] = 1;
		}
	}
	(currentVotes);
}

$('#vote-aye').click(function () {
	if (!currentProject) return;
	match(currentProject.votacion.AFIRMATIVO);
	$('#voting').fadeOut(200, loadRandomProject).fadeIn(100);
});
$('#vote-nay').click(function () {
	if (!currentProject) return;
	match(currentProject.votacion.NEGATIVO);
	$('#voting').fadeOut(200, loadRandomProject).fadeIn(100);
});
$('#vote-abs').click(function () {
	if (!currentProject) return;
	$('#voting').fadeOut(200, loadRandomProject).fadeIn(100);
});

$('#finish').click(function () {
	var results = new Array();
	for (var i in currentVotes) {
		var n = currentVotes[i];
		if (!(results[n])) {
			results[n] = new Array();
		}
		results[n].push(representatives[i]);
	}
	$('#reps').empty();
	for (var i = results.length - 1; i >= 0; i--) {
		var a = results[i];
		for (var j = 0; j < a.length; j++) {
			var e = document.createElement('li');
			$(e).text(a[j].nombre + ' ('
				+ a[j].bloque + ') '
				+ a[j].distrito + ' [' + i + ']');
			$('#reps').append(e);
		}
		break; // only show top matches -- TODO
	}
	display('results');
});

$('#start').click(function () { display('voting'); });
$('#info').click(function () { display('about'); });
$('#back').click(function () { display('intro'); });
$('#resume').click(function () { display('voting'); });
$('#reset').click(reset);
$(document).ready(reset);
