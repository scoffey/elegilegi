getString = {
	'title': 'Elegi Legi',
	'yes': 'Sí',
	'no' : 'No',
	'dk' : 'No sé',
	'question': '¿Votarías a favor de la siguiente ley?',
	'quitQuestion' : '¿Estás seguro de que querés comenzar de nuevo? Se perderán todas las respuestas.'
};

var dummy = [[{name: 'Nombre 1', party: 'Party 1', province: 'Province1'},{name: 'Nombre 2', party: 'Party 2', province: 'Province2'},{name: 'Nombre 3', party: 'Party 3', province: 'Province3'}],
[{name: 'Nombre 1', party: 'Party 1', province: 'Province1'},{name: 'Nombre 3', party: 'Party 3', province: 'Province3'}],	
[{name: 'Nombre 1', party: 'Party 1', province: 'Province1'},{name: 'Nombre 2', party: 'Party 2', province: 'Province2'},{name: 'Nombre 2', party: 'Party 2', province: 'Province2'},{name: 'Nombre 3', party: 'Party 3', province: 'Province3'}],
[{name: 'Nombre 1', party: 'Party 1', province: 'Province1'},{name: 'Nombre 3', party: 'Party 3', province: 'Province3'}],
[{name: 'Nombre 1', party: 'Party 1', province: 'Province1'},{name: 'Nombre 2', party: 'Party 2', province: 'Province2'},{name: 'Nombre 2', party: 'Party 2', province: 'Province2'},{name: 'Nombre 3', party: 'Party 3', province: 'Province3'}],
[{name: 'Nombre 1', party: 'Party 1', province: 'Province1'}]];			
var laws = ['Ley1','Ley2','Ley3','Ley4','Ley5'];
var i = 0;
var answers = {};
var current_law;

var show_results = function() {
		$$('div.results-container').set('style', '');
}

window.addEvent('domready', function() {
	var yes_button = $('yes');
	var no_button = $('no');
	var dk_button = $('dk');
	var results = $$('table.results');
	var law_name = $$('a.law')
	
	$('title').set('text', getString['title']);
	$$('div.results-container').set('style', 'display:none');
	$$('a.again').addEvent('click', function(){
		if (confirm(getString['quitQuestion']))
			window.location.reload();
	});
	
	yes_button.set('text', getString['yes']);
	no_button.set('text', getString['no']);
	dk_button.set('text', getString['dk']);
	
	var jsonRequest = new Request.JSON({
		url: 'file://localhost/Users/bohicamp/bohicamp_project/test.json',
		onSuccess: function(person){
			alert('saxs');
		},
		onFailure: function() {
			
			current_law = laws[i];
			if (!current_law) {
				yes_button.set('style', 'display:none');
				no_button.set('style', 'display:none');
				dk_button.set('style', 'display:none');
				$('question').set('style', 'display:none');
				return;
			}

			law_name.set('text', current_law);
			
			

			
			var content = '';
			dummy[i].each(function(elem){
				content += '<tr>';

				content += '<td>';
				content += elem.name;
				content += '</td>';

				content += '<td>';
				content += elem.party;
				content += '</td>';

				content += '<td>';
				content += elem.province;
				content += '</td>';

				content += '</tr>';
			});
			results.set('html', content);
			i++;
			if (i==2)
			show_results();
		}
	});
	jsonRequest.put(answers);
	
	yes_button.addEvent('click', function(){
		answers[current_law] = 1;
		jsonRequest.post(answers);
	});
	no_button.addEvent('click', function(){
		answers[current_law] = -1;
		jsonRequest.post(answers);
	});
	dk_button.addEvent('click', function(){
		answers[current_law] = 0;
		jsonRequest.post(answers);
	});
	
	
	yes_button.addEvent('mouseenter', function(){	
	});
	yes_button.addEvent('mouseleave', function(){
	});
	
	

	
});