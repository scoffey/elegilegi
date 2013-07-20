var projectIds = null;
var representatives = null;
var currentProject = null;
var currentVotes = null;

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
	$('#link').click(function () {
		if (!currentProject) return;
		window.open(currentProject.url, '_blank');
	});
	$.getJSON('data/curated-index.json', function (data) {
		projectIds = shuffle(data);
	});
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
		$('#date').text(data.asunto + ' - ' + data.fecha);
		$('#voting').fadeIn(100);
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

//$('#finish').click(finish);

$('#start').click(function () { $('#intro').fadeOut(200, loadRandomProject); });
$('#info').click(function () { $('#about').slideToggle(500); });
$('#back').click(function () { $('#about').slideToggle(500); });
//$('#resume').click(function () { ('#voting').css('display', 'block'); });
$('#reset').click(reset);
$(document).ready(reset);
