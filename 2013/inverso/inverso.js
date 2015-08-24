var representatives = {};
var lists = {};
var results = {};
var votes = {};
var projectData = {};

var projects = [
	'ley-26331',
	'ley-26425',
	'ley-26522',
	'ley-26571',
	'ley-26618',
	'ley-26637',
	'ley-26639',
	'ley-26649',
	'ley-26728',
	'ley-26729',
	'ley-26734',
	'ley-26736',
	'ley-26737',
	'ley-26739',
	'ley-26740',
	'ley-26741',
	'ley-26743',
	'ley-26761',
	'ley-26764',
	'ley-26773',
	'ley-26774',
	'ley-26784',
	'ley-26790',
	'ley-26831',
	'ley-26842',
	'ley-26843',
	'ley-26844',
	'ley-26853',
	'ley-26854',
	'ley-26855',
	'ley-26860',
	'proyecto-res-125'
];

function reset() {
	results = {};
	votes = {};
	$('#intro').css('display', 'block');
	$('#about').css('display', 'none');
	$('#mapview').css('display', 'none');
	$('#voting').css('display', 'none');
	$('#results').css('display', 'none');
	$('#district').text('');
	$('#house').text('');
}

function start() {
	$('#intro').fadeOut(200, function () {
		$('#mapview').fadeIn(100);
	});
}

function onSelectDistrict(e) {
	var district = $(e.target).attr('id');
	$('#mapview').fadeOut(200, function () {
		$('#district').text(district);
		$('#house').text('Diputados Nacionales');
		showCandidateLists();
		$('#voting').fadeIn(100);
	});
}

function getHouse() {
	var house = $('#house').text();
	if (!house) return null;
	return (house.indexOf('Diputados') == 0 ? 'Diputados' : 'Senado');
}

function showCandidateLists() {
	var district = $('#district').text();
	var selectedLists = lists[district][getHouse()];
	if (!selectedLists) return false;
	var root = $('#lists');
	root.empty();
	for (var i = 0; i < selectedLists.length; i++) {
		var list = selectedLists[i];
		var p = $(document.createElement('p')).text(list['lista']);
		var ol = $(document.createElement('ol'));
		for (var j = 0; j < list['candidatos'].length; j++) {
			var name = list['candidatos'][j];
			var li = $(document.createElement('li')).text(name);
			ol.append(li);
		}
		var li = $(document.createElement('li'));
		li.append(p).append(ol).addClass('list');
		li.click(onSelectCandidateList);
		root.append(li);
	}
	return true;
}

function onSelectCandidateList(e) {
	var items = $(e.delegateTarget).find('li');
	$.each(items, function (i, li) {
		var id = slugify($(li).text());
		if (representatives[id]) {
			results[id] = representatives[id];
		}
	});
	$('#voting').fadeOut(200, function () {
		if (getHouse() != 'Senado') {
			$('#house').text('Senadores Nacionales');
			var hasSenateElection = showCandidateLists();
			if (hasSenateElection) {
				$('#voting').fadeIn(100);
			} else {
				showResults();
				$('#results').fadeIn(100);
			}
		} else {
			showResults();
			$('#results').fadeIn(100);
		}
	});
}

function showResults() {
	$('#projects').empty();
	var n = 0;
	for (var i = 0; i < projects.length; i++) {
		var p = projectData[projects[i]];
		n += (printProjectResult(p) ? 1 : 0);
	}
	$(n ? '#available-notice' : '#not-available-notice').show();
	$(n ? '#not-available-notice' : '#available-notice').hide();
	return (n ? true : false);
}

function printProjectResult(project) {
	var ul = $(document.createElement('ul'));
	var isValid = false;
	var votes = ['AFIRMATIVO', 'NEGATIVO', 'ABSTENCION', 'AUSENTE'];
	for (var i in results) {
		for (var j = 0; j < votes.length; j++) {
			var v = votes[j];
			var voters = project.votacion[v];
			if (voters && voters.indexOf(i) != -1) {
				isValid = true;
				var e = $(document.createElement('li'));
				var s = $(document.createElement('span'));
				s.text(votes[j]).addClass(v.toLowerCase());
				var t = $(document.createElement('span'));
				t.text(representatives[i].nombre);
				ul.append(e.append(s).append(t));
			}
		} 
	}
	if (!isValid) return false;
	var li = $(document.createElement('li'));
	var p = $(document.createElement('p'));
	var a = $(document.createElement('a')).text(project.nombre)
		.attr({'href': project.url, 'target': '_blank'})				.css({'font-weight': 'bold'});
	var sub = $(document.createElement('p')).text(project.sumario)
		.addClass('shady');
	li.append(p.append(a)).append(sub).append(ul);
	$('#projects').append(li);
	return true;
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

	$.each(projects, function (i, id) {
		$.getJSON('../data/' + id + '.json', function (data) {
			projectData[id] = data;
		});
	});

	$.getJSON('../data/legisladores.json', function (data) {
		representatives = data;
	});

	$.getJSON('listas.json', function (data) {
		lists = data;
		$('#start').click(start);
	});

	$('.facebook').click(shareOnFacebook);
	$('.twitter').click(shareOnTwitter);
	$('.googleplus').click(shareOnGooglePlus);

	$('#info').click(function () { $('#about').slideToggle(500); });
	$('#back').click(function () { $('#about').slideToggle(500); });
	$('#map path').click(onSelectDistrict);
	$('#reset').click(reset);
	reset();
});

var stripAccents = (function () {
  var in_chrs   = '\u00e0\u00e1\u00e2\u00e3\u00e4\u00e7\u00e8\u00e9\u00ea\u00eb\u00ec\u00ed\u00ee\u00ef\u00f1\u00f2\u00f3\u00f4\u00f5\u00f6\u00f9\u00fa\u00fb\u00fc\u00fd\u00ff\u00c0\u00c1\u00c2\u00c3\u00c4\u00c7\u00c8\u00c9\u00ca\u00cb\u00cc\u00cd\u00ce\u00cf\u00d1\u00d2\u00d3\u00d4\u00d5\u00d6\u00d9\u00da\u00db\u00dc\u00dd',
  //  in_chrs   = 'àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
      out_chrs  = 'aaaaaceeeeiiiinooooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY',
      chars_rgx = new RegExp('[' + in_chrs + ']', 'g'),
      transl    = {},
      lookup    = function (m) { return transl[m] || m; };

  for (var i = 0; i < in_chrs.length; i++) {
    transl[in_chrs[i]] = out_chrs[i];
  }

  return function (s) { return s.replace(chars_rgx, lookup); }
})();

var slugify = function (s) {
	s = stripAccents(s).replace(/[^\w\s-]/g, ''); // normalize chars
	s = s.replace(/^\s+|\s+$/g, '').toLowerCase(); // trim and lower
	return s.replace(/[-\s]+/g, '-'); // join slug words
};

