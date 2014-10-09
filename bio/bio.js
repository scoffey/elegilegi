var BioGame = {};

$(document).ready(function () {
	$.getJSON('data.json', init);
});

var init = function (data) {
	BioGame.data = data;
	BioGame.counters = {'good': 0, 'bad': 0};
	skipBio();
};

var newElem = function (tagname) {
	return $(document.createElement(tagname));
};

var newAnchor = function (callback, title) {
	return newElem('a').click(callback).attr({
		'href': 'javascript:void(0);',
		'title': title
	});
};

var makeAvatar = function (item) {
	var title = item['name'] + ' @' + item['screen_name'];
	var img = newElem('img').attr({
		'src': item['profile_image_url'],
		'alt': item['screen_name'],
		'title': title
	});
	return newAnchor(matchAvatar, title).append(img);
};

Array.prototype.shuffle = function () {
	var i = this.length, j, temp;
	if (i == 0) return this;
	while (--i) {
		j = Math.floor(Math.random() * (i + 1));
		temp = this[i];
		this[i] = this[j];
		this[j] = temp;
	}
	return this;
};

var getQueryStringParam = function (name, defaultValue) {
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
	var results = regex.exec(location.search);
	if (results == null) return defaultValue;
	return decodeURIComponent(results[1].replace(/\+/g, " "));
}

var skipBio = function (e) {
	var p = $('#avatars').empty();
	if (BioGame.data.length == 0) return; // TODO: win!
	BioGame.data.shuffle();
	var n = parseInt(getQueryStringParam('n', 8));
	var m = Math.min(n, BioGame.data.length);
	for (var i = 0; i < m; i++) {
		var item = BioGame.data[i];
		if (Math.floor(Math.random() * 2) == 1) {
			p.append(makeAvatar(item));
		} else {
			p.prepend(makeAvatar(item));
		}
	}
	var item = BioGame.data[0];
	$('#bio').text(item['description'] || '(Sin Twitter bio)');
};

var matchAvatar = function (e) {
	if (BioGame.data.length == 0) return; // TODO: win!
	var img = $(e.target);
	if (img.attr('alt') == BioGame.data[0]['screen_name']) {
		BioGame.data.shift();
		updateScore(1);
	} else {
		updateScore(-1);
	}
	skipBio();
};

var updateScore = function (delta) {
	var c = BioGame.counters;
	if (delta > 0) c.good++;
	if (delta < 0) c.bad++;
	var total = c.good + c.bad;
	var score = total ? Math.round(c.good * 100 / total) : 0;
	var span = newElem('span').text(score + '%');
	if (delta > 0) span.css('color', '#3c3');
	if (delta < 0) span.css('color', '#c33');
	$('#score').text('Aciertos: ').append(span);
};

