var app = app || {};

app.popquiz = (function () {

	var popquiz = {},
		teams = [],
		rounds = [],
		rankingAfterRound = [],
        rankingPerRound = [],
        lastround = 0,
        listtable = null,
        rankingtable = null,
        lastroundhighest = 0,
        lastroundaverage = 0,
        lastroundtotal = 0,
        scrolling = false;

	function privateMethod() {
		// ...
	}



	function processData(allText) {

	    var allTextLines = allText.split(/\r\n|\n/);

	    // read lines
	    for(var i=0; i<allTextLines.length;i++){

			if(allTextLines[i]!="")
			{
				var entries = allTextLines[i].split(';');

		    	// read rounds
		    	if(i==0){
		    		for(var r=1;r<entries.length;r++)
		    		{
	                    if(r>1)
	                    { 
	                    	rounds.push({id:(r-1),name:entries[r]});
	                    	rankingAfterRound.push([]);
	                    	rankingPerRound.push([]);
	                    }
		    		}
		    	}

		    	// read maxs
		    	if(i==1){
		    		for(var r=2;r<entries.length;r++)
		    		{
						rounds[(r-2)].max=entries[r];
		    		}
		    	}
		    	
	            // read data
		    	if(i>1){

	                var team = {scores:[], id:(i-1)};
	                var totalscore = 0;

		    		for(var r=1;r<entries.length;r++)
		    		{
	                    var entry = entries[r];

	                    // ploeg
	                    if(r==1){
	                        team.name=entry;                          
	                    }
	                    else{
	                    	var score = entry==""?0:parseInt(entry,10);
	                    	totalscore += score;
	                        team.scores.push(score);
	                        
	                        if(r<(entries.length-1))
	                        {
	                        	if(score>0 && (r-2)>lastround){lastround=(r-2);}
								rankingAfterRound[(r-2)].push({id:(i-1), score:totalscore});
								rankingPerRound[(r-2)].push({id:(i-1), score:score});
	                        }

	                    }
		    		}
		    		team.total = parseInt(entries[(entries.length-1)],10);
	                teams.push(team);

		    	}

		    }
	    	

	    }

		$('#poster').fadeOut(renderInterface);


	}

	function renderInterface(){

		// show main wrapper
		$("#mainwrapper").show();

		
		// sort rankings
		for(var t=0;t<rankingAfterRound.length;t++){
			rankingAfterRound[t].sort(dynamicSort("score")).reverse();
			rankingPerRound[t].sort(dynamicSort("score")).reverse();
		}

		// set rank
		for(var t=0;t<rankingAfterRound.length;t++){

			var rank = 0,
				prevscore = -1;

			for(var s=0;s<rankingAfterRound[t].length;s++){

				if(rankingAfterRound[t][s].score!=prevscore)
				{
					rank = (s+1);
					prevscore = rankingAfterRound[t][s].score;
				}

				rankingAfterRound[t][s].rank = rank;

				// ranking last round
				if(t==lastround)
				{
					//console.info(rankingAfterRound[t][s].id);
					teams[rankingAfterRound[t][s].id-1].rank = rank;
				}

				// ranking evolution
				if(typeof teams[rankingAfterRound[t][s].id-1].ranks == 'undefined')
				{
					teams[rankingAfterRound[t][s].id-1].ranks = [];
					teams[rankingAfterRound[t][s].id-1].negranks = [];
				}

				teams[rankingAfterRound[t][s].id-1].ranks.push(rank);
				teams[rankingAfterRound[t][s].id-1].negranks.push(teams.length-rank);
				
			}

			rank = 0;
			prevscore = -1;
			

			for(var s=0;s<rankingPerRound[t].length;s++){

				if(t==lastround)
				{
					lastroundtotal += rankingPerRound[t][s].score;
					if(rankingPerRound[t][s].score > lastroundhighest){
						lastroundhighest = rankingPerRound[t][s].score;
					}
				}

				if(rankingPerRound[t][s].score!=prevscore)
				{
					rank++;
					prevscore = rankingPerRound[t][s].score;
				}
				rankingPerRound[t][s].rank = rank;
			}
			
		}

    	// render ranking
		renderRanking(lastround);
		renderList(lastround);

		showTable();

		$('#iconstat').show();
		$('#iconplay').show();

		$('.navbar').fadeOut();

		lastroundaverage = parseFloat(lastroundtotal / teams.length).toFixed(1);


		$('.lastround').html(rounds[lastround].name);
		$('.lastroundhighest').html(lastroundhighest);
		$('.lastroundaverage').html(lastroundaverage);
		$('.lastroundmax').html(rounds[lastround].max);
	}


	function renderList(round){
		// render list
		var $listbody = $('#listbody'),
			$listhead = $('#listhead');
		$listbody.empty();
		$listhead.empty();

		// set head
		$listhead.append('<th>ID</th><th>Team</th>');

		// set rounds
		$.each(rounds, function(i,round){

			
			if(i<=lastround || i==(rounds.length-1))
			{
				$listhead.append('<th>' + (i==(rounds.length-1)?"TOT":(i+1)) + '<br/>/' + round.max + '</th>');
			}

		});

		$listhead.wrapInner('<tr></tr>');


		// Teams
		$.each(teams, function(i,team){

			// Team name
			var mytable ='<tr><td>' + team.id + '.</td><td>' + ( team.name.length>38?HTMLEncode(team.name.substring(0,35)) + ' ...':HTMLEncode(team.name)) + '</td>';

			// Team scores
			$.each(team.scores,function(x,score){
				
				if(x<=lastround || x==(rounds.length-1))
				{
					mytable +='<td style=""><span class="badge '+ (x<=lastround?getScoreStyle(i, score, rounds[x].max):"") +'">' + score +'</span></td>';
				}

			});
	    	mytable +="</tr>";

	    	$listbody.append(mytable);

		});

	}


	function renderRanking(round){
		// render ranking
		var $rankinghead = $('#rankinghead'),
			$rankingbody = $('#rankingbody'),
			top3total = "",
			top3lastround = "",
			top3lstcnt = 1,
			top3prev = 0,
			top3rnk = 1;

		$rankinghead.empty();
		$rankingbody.empty();


		// set head
		$rankinghead.append('<th>Rank</th><th></th><th>Team</th><th>'+round+'</th><th>'+(round+1)+'</th><th>Total</th>'); //<th>Evolution</th><th>Highest</th><th>Lowest</th>');
		$rankinghead.wrapInner('<tr></tr>');

		$.each(rankingPerRound[round], function(t,tms){

			if(top3lstcnt<=3 || top3prev == tms.score)
			{
				top3lastround += top3rnk + ". " + teams[tms.id-1].name + " ("+tms.score+")<br/>";
				top3lstcnt++;

				if(top3prev!=tms.score && top3rnk>1)
				{
					top3rnk++;
				}

				top3prev = tms.score;
			}
		});






		$('#rankingtitle').html('Ranking na '+rounds[round].name);
		$.each(rankingAfterRound[round], function(r,rank){

			if(rank.rank <= 3)
			{
				top3total += rank.rank + ". " + teams[rank.id-1].name + " ("+rank.score+")<br>";
			}


			// compare to previous round
			var prevrank = 0, diff=0;
			if(round>0)
			{
				// get prevoius rank
				$.each(rankingAfterRound[lastround-1],function(pr, prank){if(prank.id==rank.id){prevrank=prank.rank;}});
				diff = prevrank - rank.rank;
			}

			// inject ranking for last round
			if(round==lastround)
			{
				$('#team_'+rank.id).html(rank.rank + '. ');
			}
			

			// last round scores
			var rrid = 0;
			$.each(rankingPerRound[round], function(t,rr){

				if(rr.id==teams[rank.id-1].id)
				{
					rrid = t;
				}

			});
			
			// last round -1  scores
			var rrid0 = 0;
			$.each(rankingPerRound[round-1], function(t,rr){

				if(rr.id==teams[rank.id-1].id)
				{
					rrid0 = t;
				}

			});

			// render table
			$rankingbody.append('<tr><td>' + rank.rank + '</td><td>' + (diff>0?'+':(diff==0?'':'-')) + '</td><td>' + teams[rank.id-1].name + '</td><td>' + rankingPerRound[round-1][rrid0].score + '</td><td>' + rankingPerRound[round][rrid].score + '</td><td><span class="badge">' + rank.score +'</span></td></tr>'); //<td><span class="inlinesparkline">'+teams[rank.id-1].negranks.join(',')+'</span></td><td>'+getMinOfArray(teams[rank.id-1].ranks)+'</td><td>'+getMaxOfArray(teams[rank.id-1].ranks)+'</td></tr>');

		});

		$('.top3total').html(top3total);
		$('.top3lastround').html(top3lastround);

	}

	function getMaxOfArray(numArray) {
	    return Math.max.apply(null, numArray);
	}

	function getMinOfArray(numArray) {[]
	    return Math.min.apply(null, numArray);
	}

	function dynamicSort(property) {
	    var sortOrder = 1;
	    if(property[0] === "-") {
	        sortOrder = -1;
	        property = property.substr(1);
	    }
	    return function (a,b) {
	        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
	        return result * sortOrder;
	    }
	}


	function getScoreStyle(idx, score, max){

		var coeff = parseFloat(score) / parseFloat(max);
		var result = "";

		// orange
		if(coeff>=0.3 && coeff<=0.5)
		{
			result = 'orange';
		}

		// green
		if(coeff>0.5)
		{
			result = 'green';

		}

		// red
		if(coeff<0.3){
			result = 'red';
		}

		return result;
	}

	function readFile(e) {

		var file = fileInput.files[0];

		var reader = new FileReader();

		reader.onload = function(e) {
			processData(reader.result);
		}

		reader.readAsText(file);
	}


	function HTMLEncode(str){
	  var i = str.length,
	      aRet = [];

	  while (i--) {
	    var iC = str[i].charCodeAt();
	    if (iC < 65 || iC > 127 || (iC>90 && iC<97)) {
	      aRet[i] = '&#'+iC+';';
	    } else {
	      aRet[i] = str[i];
	    }
	   }
	  return aRet.join('');    
	}

	function showList(){

		$('.modal').modal('hide');
		$('#listmodal').modal('show');

		var $list = $('#list'),
			$rank = $('#ranking');

		$rank.hide();
		$list.show();

		if(listtable != null)
		{
			listtable.destroy();
		}

		var docheight = $( window ).height();
		
		listtable = $('#list table').DataTable({
	        "scrollY":   docheight - 61,
	        "scrollX": "100%",
	        "scrollCollapse": true,
	        "paging":         false,
	        bFilter: false, bInfo: false
	    });

	    var fx = new $.fn.dataTable.FixedColumns( listtable, {
        	leftColumns: 2
    	} );
	}

	function showRanking(){

		$('.modal').modal('hide');
		$('#rankingmodal').modal('show');

		var $list = $('#list'),
			$rank = $('#ranking'),
			docheight = $( window ).height();

		$rank.show();
		$list.hide();


		if(rankingtable != null)
		{
			rankingtable.destroy();
		}
		
		rankingtable = $('#ranking table').DataTable({
	        "scrollY":       docheight - 41,
	        "scrollCollapse": true,
	        "paging":         false,
	        bFilter: false, bInfo: false
	        
	    });
/*
	   	var fx = new $.fn.dataTable.FixedColumns( rankingtable, {
        	leftColumns: 2
    	} );*/
	}

	function showTable(){

		if($('#list').is(':visible'))
		{
			showRanking();
			//$('.inlinesparkline').sparkline('html', {width:'100px',fillColor: '',lineColor: '#666666'}); 
		}
		else{
			showList();
		}
	}

	function setEvents(){

		// read file
		var fileInput = document.getElementById('fileInput');
		fileInput.addEventListener('change', readFile);

		// icons
		$('#iconopen').click(function(){$('#fileInput').click();});
		$('#iconstat').click(showTable);

		// top menu
		$(document).keypress(function(e){

			if(e.keyCode==113)
			{
				$('.navbar').fadeToggle();
			}

			if(e.keyCode==115)
			{
				showTable();
			}

		});

		$('#iconplay').click(function(){
			$('#list table').parent().animate({scrollTop: 1500}, { "duration": 20000, "easing": "linear", complete: function(){
				$('#list table').parent().animate({scrollTop: 0}, { "duration": 20000, "easing": "linear" });
			}});
		});

		$(window).resize(function(){

			// list
			if($('#list').is(':visible'))
			{
	  			var oSettings = listtable.settings();
	    		oSettings[0].oScroll.sY = $(window).height()-62; 
	    		listtable.draw();
	    	}
	    	else
	    	{
	    		// rank
	    		if(typeof rankingtable != 'undefined' && rankingtable != null)
	    		{
	    			//console.info(rankingtable);
		  			var oSettings = rankingtable.settings();
		    		oSettings[0].oScroll.sY = $(window).height()-62; 
		    		rankingtable.draw();

	    		}

	    	}


		});

	}

	popquiz.init = function () 
	{

		setEvents();
		
	};

	return popquiz;
}());

$(document).ready(function(){

	app.popquiz.init();
});