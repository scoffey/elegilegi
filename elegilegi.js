var projectIds = null;
var representatives = null;
var currentProject = null;
var currentVotes = null;

var projects = [
	"exp-11-pe-11-orden-del-dia-03-votacion-en-general",
	"exp-13-pe-08-votacion-en-general",
	"exp-16-jgm-11-orden-del-dia-01-votacon-en-general",
	"exp-1737-d-09-y-0574-d-10-od-197-vot-en-general",
	"exp-22-pe-09-y-otros-orden-del-dia-2005-vot-en-general",
	"exp-27-pe-08-orden-del-dia-1167-votacion-en-general",
	"exp-2843-d-06-y-otro-orden-del-dia-1479-vot-en-general",
	"exp-31-pe-09-votacion-en-general-y-particular",
	"exp-3306-d-10-orden-del-dia-1044-votacion-en-general",
	"exp-38-pe-08-orden-del-dia-1530-votacion-en-general",
	"exp-4029-d-09-y-otros-o-d-873-vot-en-general",
	"exp-7243-d-10-y-otros-orden-del-dia-2913-votacion-en-general",
	"expediente-01-pe-12-votacion-en-general",
	"expediente-04-pe-12-orden-del-dia-1458-votacion-en-general",
	"expediente-1-pe-10-y-otros-orden-del-dia-1868",
	"expediente-1-pe-11-orden-del-dia-09-votacion-en-general",
	"expediente-10-s-13-orden-del-dia-1905-votacion-en-general",
	"expediente-11-s-13-orden-del-dia-1907-votacion-en-general-y-particular",
	"expediente-118-s-12-orden-del-dia-1164-votacion-en-general",
	"expediente-12-s-13-orden-del-dia-1906-votacion-en-general-y-particular",
	"expediente-121-s-12-orden-del-dia-1308-votacion-en-general",
	"expediente-128-s-11-orden-del-dia-1812-votacion-en-general-y-particular",
	"expediente-15-jgm-12-orden-del-dia-1044-votacion-en-general-y-particular",
	"expediente-1943-d-12-y-otros-orden-del-dia-494-votacion-en-general-y-particular",
	"expediente-236-s-12-orden-del-dia-1867-votacion-en-general-y-particular",
	"expediente-24-pe-10-orden-del-dia-n-10-votacion-en-general",
	"expediente-26-s-12-orden-del-dia-192-votacion-en-general",
	"expediente-29-s-12-orden-del-dia-288-votacion-en-general-",
	"expediente-8-pe-11-orden-del-dia-07-votacion-en-general",
	"expediente-94-s-12-orden-del-dia-690-votacion-en-general"
];

function shuffle(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = (Math.random() * counter--) | 0;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function reset() {
	currentProject = null;
	currentVotes = {};
	projectIds = shuffle(projects.slice(0));
	$.getJSON('data/legisladores.json', function (data) {
		representatives = data;
	});
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
	$.getJSON('data/proyectos/' + id + '.json', function (data) {
		currentProject = data;
		$('#project').text(data.nombre);
		$('#summary').text(data.sumario);
		$('#date').text(data.fecha + ' - ' + data.asunto);
		$('#voting').fadeIn(100);
		var n = projects.length;
		var i = n - projectIds.length - 1;
		var p = Math.round(i * 100 / n);
		$('#progress-bar span').css('width', p + '%');
		$('#progress-status').text('Completado: ' + i + ' / ' + n);
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
}

function finish() {
	var results = new Array();
	for (var i in currentVotes) {
		var n = currentVotes[i];
		if (!(results[n])) {
			results[n] = new Array();
		}
		results[n].push(representatives[i]);
	}
	var count = 0;
	$('#reps').empty();
	for (var i = results.length - 1; i >= 0; i--) {
		var a = results[i];
		for (var j = 0; j < a.length; j++) {
			var e = document.createElement('li');
			$(e).text(a[j].nombre + ' ('
				+ a[j].bloque + ') '
				+ a[j].distrito + ' [' + i + ']');
			$('#reps').append(e);
			count++;
		}
		if (count >= 8) break; // only show top matches
	}
	$('#voting').stop(true);
	$('#voting').fadeOut(200, function () {
		$('#results').fadeIn(100);
	});
}

$(document).ready(function () {
	$('#vote-aye').click(function () {
		if (!currentProject) return;
		match(currentProject.votacion.AFIRMATIVO);
		$('#voting').fadeOut(200, loadRandomProject);
	});
	$('#vote-nay').click(function () {
		if (!currentProject) return;
		match(currentProject.votacion.NEGATIVO);
		$('#voting').fadeOut(200, loadRandomProject);
	});
	$('#vote-abs').click(function () {
		if (!currentProject) return;
		$('#voting').fadeOut(200, loadRandomProject);
	});

	$('#link').click(function () {
		if (!currentProject) return;
		window.open(currentProject.url, '_blank');
	});
	$('#start').click(function () {
		$('#intro').fadeOut(200, loadRandomProject);
	});
	$('#info').click(function () { $('#about').slideToggle(500); });
	$('#back').click(function () { $('#about').slideToggle(500); });
	$('#reset').click(reset);
	reset();
});
