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
        scrolling = false,
        scrollDown = true,
		teamtype = 0; // 0 = all, 1 = circuit, 2 = gelegenheid

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
	                    if(r>2)
	                    { 
	                    	rounds.push({id:(r-2),name:entries[r]});
	                    	rankingAfterRound.push([]);
	                    	rankingPerRound.push([]);
	                    }
		    		}
		    	}

		    	// read maxs
		    	if(i==1){
		    		for(var r=3;r<entries.length;r++)
		    		{
						rounds[(r-3)].max=entries[r];
		    		}
		    	}
		    	
	            // read data
		    	if(i>1){

	                var team = {scores:[], id:(i-1), type: 2};
	                var totalscore = 0;

		    		for(var r=1;r<entries.length;r++)
		    		{
	                    var entry = entries[r];

	                    // ploeg
	                    if(r==1){
	                        team.name=entry;                          
	                    }
	                    else if(r==2)
	                    {
	                    	if(entry == '1'){
	                    		team.type = 1;
	                    	}	                    	
	                    }
	                    else{
	                    	var score = entry==""?0:parseInt(entry,10);
	                    	totalscore += score;
	                        team.scores.push(score);
	                        
	                        if(r<(entries.length-1))
	                        {
	                        	if(score>0 && (r-3)>lastround){lastround=(r-3);}
								rankingAfterRound[(r-3)].push({id:(i-1), score:totalscore});
								rankingPerRound[(r-3)].push({id:(i-1), score:score});
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

	function renderInterface(pricesort){
		var filteredteams = 0;

		// show main wrapper
		$("#mainwrapper").show();


		// Clean
		if(listtable != null)
		{
			listtable.destroy();
		}

		if(rankingtable != null)
		{
			rankingtable.destroy();
		}

		lastroundtotal = 0;
		lastroundhighest = 0;

		$('#list').html('<table class="stripe hover" cellspacing="0"><thead id="listhead"></thead><tbody id="listbody"></tbody></table>');
		$('#ranking').html('<table class="stripe hover" cellspacing="0" width="100%"><thead id="rankinghead"></thead><tbody id="rankingbody"></tbody></table><div></div>');
		
		// sort rankings
		var specSort = pricesort || false;
		
		for(var t=0;t<rankingAfterRound.length;t++){
			rankingAfterRound[t].sort(dynamicSort("score")).reverse();
			rankingPerRound[t].sort(dynamicSort("score")).reverse();
		}

		// set rank
		
		// t = round
		for(var t=0;t<rankingAfterRound.length;t++){

			var rank = 0,
				g_rank = 0, // gelegenheidsploeg rank
				c_rank = 0, // circuitploeg rank
				prevscore = -1,
				g_prevscore = -1,
				c_prevscore = -1,
				g_idx = 0,
				c_idx = 0;

			// s = team sorted by score
			for(var s=0;s<rankingAfterRound[t].length;s++){

				if(rankingAfterRound[t][s].score!=prevscore)
				{
					rank = (s+1);
					prevscore = rankingAfterRound[t][s].score;
				}

				// gelegenheidsploeg
				var srank = 0;
				if(teams[rankingAfterRound[t][s].id-1].type == 2) {
					if(rankingAfterRound[t][s].score!=g_prevscore) {
						g_rank = (g_idx+1);
						g_prevscore = rankingAfterRound[t][s].score;
					}
					srank = g_rank;
					g_idx++;
				}

				// circuitploeg
				if(teams[rankingAfterRound[t][s].id-1].type == 1) {
					if(rankingAfterRound[t][s].score!=c_prevscore) {
						c_rank = (c_idx+1);
						c_prevscore = rankingAfterRound[t][s].score;
					}
					srank = c_rank;					
					c_idx++;
				}

				rankingAfterRound[t][s].rank = rank;
				rankingAfterRound[t][s].srank = srank;

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

				if(teamtype == 0 || teams[rankingPerRound[t][s].id-1].type == teamtype)
				{
					if(t==lastround)
					{
						filteredteams++;
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
			
		}

    	// render ranking
		renderRanking(lastround, specSort);
		renderList(lastround);

		showTable(false);

		$('#iconstat').show();
		$('#iconplay').show();
		$('#iconfilter').show();
		$('#iconprice').show();

		//$('.navbar').fadeOut();

		lastroundaverage = parseFloat(lastroundtotal / filteredteams).toFixed(1);


		$('.lastround').html(rounds[lastround].name);
		$('.lastroundhighest').html(lastroundhighest);
		$('.lastroundaverage').html(lastroundaverage);
		$('.lastroundmax').html(rounds[lastround].max);

		var ftext = "";
		if(teamtype == 1)
		{
			ftext = " - Circuitploegen";
		}
		if(teamtype == 2)
		{
			ftext = " - Gelegenheidsploegen";
		}
		$('.filtertext').html(ftext);
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

			if(teamtype == 0 || teamtype == team.type)
			{
				// Team name
				var mytable ='<tr><td>' + team.id + '.</td><td>' + ( team.name.length>38?HTMLEncode(team.name.substring(0,35)) + ' ...':HTMLEncode(team.name)) + (team.type == 1?'&nbsp;<span class="cbadge glyphicon glyphicon-bookmark">&nbsp;</span>':'')  + '</td>';

				// Team scores
				$.each(team.scores,function(x,score){
					
					if(x<=lastround || x==(rounds.length-1))
					{
						mytable +='<td style=""><span class="badge '+ (x<=lastround?getScoreStyle(i, score, rounds[x].max):"") +'">' + score +'</span></td>';
					}

				});
		    	mytable +="</tr>";

		    	$listbody.append(mytable);
			}
		});

	}


	function renderRanking(round, specSort){
		// render ranking
		var $rankinghead = $('#rankinghead'),
			$rankingbody = $('#rankingbody'),
			top3total = "",
			top3lastround = "",
			top3lstcnt = 1,
			top3prev = 0,
			top3rnk = 0;

		$rankinghead.empty();
		$rankingbody.empty();


		// set head
		if(specSort){
			$rankinghead.append('<th>Rank</th><th></th><th>Rank (Binnen type ploeg)</th><th></th><th>Team</th><th>'+round+'</th><th>'+(round+1)+'</th><th>Total</th>'); //<th>Evolution</th><th>Highest</th><th>Lowest</th>');
		} else {
			$rankinghead.append('<th>Rank</th><th>Rank (Binnen type ploeg)</th><th></th><th>Team</th><th>'+round+'</th><th>'+(round+1)+'</th><th>Total</th>'); //<th>Evolution</th><th>Highest</th><th>Lowest</th>');
		}
		
		$rankinghead.wrapInner('<tr></tr>');

		$.each(rankingPerRound[round], function(t,tms){

			if(teamtype == 0 || teamtype == teams[tms.id-1].type)
			{

				if(top3lstcnt<=3 || top3prev == tms.score)
				{
					if(top3prev!=tms.score)
					{
						top3rnk = top3lstcnt;
					}
					top3lastround += top3rnk + ". " + teams[tms.id-1].name + " ("+tms.score+")<br/>";
					top3lstcnt++;
					top3prev = tms.score;
				}
			}
		});

		// filtered ranking
		var specialrank = {},
			specialcount = 0;

		$('#rankingtitle').html('Ranking na '+rounds[round].name);
		$.each(rankingAfterRound[round], function(r,rank){

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

			if(teamtype == 0 || teamtype == teams[rank.id-1].type)
			{
				specialcount++;
				var defrank = rank.rank;

				if(teamtype == teams[rank.id-1].type)
				{
					if(typeof specialrank[rank.rank] != 'undefined')
					{
						defrank = specialrank[rank.rank];
					}
					else{
						specialrank[rank.rank] = specialcount;
						defrank = specialcount;
					}
				}

				if(defrank <= 3)
				{
					top3total += defrank + ". " + teams[rank.id-1].name + " ("+rank.score+")<br>";
				}

				// render table
				if(specSort){
					var mrank = (parseInt(rank.srank,10) * 10) + parseInt(teams[rank.id-1].type, 10);
					$rankingbody.append('<tr><td>' + defrank + '</td><td style="color:transparent;">' + mrank + '</td><td>' + rank.srank + '</td><td>' + (diff>0?'+':(diff==0?'':'-')) + '</td><td>' + teams[rank.id-1].name + (teams[rank.id-1].type == 1?'&nbsp;<span class="cbadge glyphicon glyphicon-bookmark">&nbsp;</span>':'') + '</td><td>' + rankingPerRound[round-1][rrid0].score + '</td><td>' + rankingPerRound[round][rrid].score + '</td><td><span class="badge">' + rank.score +'</span></td></tr>'); //<td><span class="inlinesparkline">'+teams[rank.id-1].negranks.join(',')+'</span></td><td>'+getMinOfArray(teams[rank.id-1].ranks)+'</td><td>'+getMaxOfArray(teams[rank.id-1].ranks)+'</td></tr>');
				} else {
					$rankingbody.append('<tr><td>' + defrank + '</td><td>' + rank.srank + '</td><td>' + (diff>0?'+':(diff==0?'':'-')) + '</td><td>' + teams[rank.id-1].name + (teams[rank.id-1].type == 1?'&nbsp;<span class="cbadge glyphicon glyphicon-bookmark">&nbsp;</span>':'') + '</td><td>' + rankingPerRound[round-1][rrid0].score + '</td><td>' + rankingPerRound[round][rrid].score + '</td><td><span class="badge">' + rank.score +'</span></td></tr>'); //<td><span class="inlinesparkline">'+teams[rank.id-1].negranks.join(',')+'</span></td><td>'+getMinOfArray(teams[rank.id-1].ranks)+'</td><td>'+getMaxOfArray(teams[rank.id-1].ranks)+'</td></tr>');
				}	
			}

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

		// Clear data
		teams = [];
		rounds = [];
		rankingAfterRound = [];
        rankingPerRound = [];
        lastround = 0;

        // read file
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
		setTimeout(function(){$('#listmodal').modal('show');}, 510);

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
	        "scrollY":   docheight - 240,
	        "scrollX": "100%",
	        "scrollCollapse": true,
	        "paging":         false,
	        bFilter: false, bInfo: false
	    });

	    var fx = new $.fn.dataTable.FixedColumns( listtable, {
        	leftColumns: 2
    	} );

		$('.head').hide();
		if(teamtype == 1)
		{
			$('.list3').show();
		}
		else if(teamtype == 2)
		{
			$('.list2').show();
		}
		else{
			$('.list1').show();
		}

	}

	function showRanking(){

		$('.modal').modal('hide');
		setTimeout(function(){$('#rankingmodal').modal('show');}, 510);
		

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
	        "scrollY":       docheight - 220,
	        "scrollCollapse": true,
	        "paging":         false,
	        bFilter: false, bInfo: false
	        
	    });

		$('.head').hide();
		if(teamtype == 1)
		{
			$('.ranking3').show();
		}
		else if(teamtype == 2)
		{
			$('.ranking2').show();
		}
		else{
			$('.ranking1').show();
		}/*
	   	var fx = new $.fn.dataTable.FixedColumns( rankingtable, {
        	leftColumns: 2
    	} );*/
	}

	function showTable(toggle){
		var dotoggle = true;

		if(typeof toggle != 'undefined')
		{
			dotoggle = toggle;
		}

		// set scrolling
		if(scrolling){
			stopScroll();
		}
		//$('.navbar').fadeOut();

		// show table
		if($('#list').is(':visible'))
		{
			if(dotoggle)
			{
				showRanking();
			}else{
				showList();
			}
			
			//$('.inlinesparkline').sparkline('html', {width:'100px',fillColor: '',lineColor: '#666666'}); 
		}
		else{
			if(dotoggle)
			{
				showList();
			}else{
				showRanking();
			}
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

			// Toggle menu
			if(e.keyCode==113)
			{
				//$('.navbar').toggle();
			}

			// Toggle list/ranking
			if(e.keyCode==115)
			{				
				showTable();
			}

			// Toggle autoplay
			if(e.keyCode==100)
			{				
				$('#iconplay').click();
			}

			// Toggle filter
			if(e.keyCode==102)
			{				
				$('#iconfilter').click();
			}

			// Open new file
			if(e.keyCode==32)
			{				
				$('#fileInput').click();
			}
		});

		$('#iconfilter').click(function(){
			doFilter();
		});

		$('#iconprice').click(function(){
			doPrice();
		});

		$('#iconplay').click(function(){
			if(scrolling)
			{				
				stopScroll();
			}
			else{
				startScroll();
			}
		});

		$(window).resize(function(){

			// list
			if($('#list').is(':visible'))
			{
	  			var oSettings = listtable.settings();
	    		oSettings[0].oScroll.sY = $(window).height()-245; 
	    		listtable.draw();
	    	}
	    	else
	    	{
	    		// rank
	    		if(typeof rankingtable != 'undefined' && rankingtable != null)
	    		{
	    			//console.info(rankingtable);
		  			var oSettings = rankingtable.settings();
		    		oSettings[0].oScroll.sY = $(window).height()-215; 
		    		rankingtable.draw();
	    		}
	    	}
		});

	}

	function doPrice(){
		teamtype = 0;
		showRanking();
		renderInterface(true);
	}

	function doFilter(){
		if(teamtype == 0){
			teamtype = 1;
			renderInterface();
		}
		else if(teamtype == 1)
		{
			teamtype = 2;
			renderInterface();
		}
		else{
			teamtype = 0;
			renderInterface();
		}
		
		/*
		if($('#list').is(':visible'))
		{
			if(listtable != null)
			{
				listtable.destroy();
			}
			renderList(lastround, 1);			
		}
		else{
			if(rankingtable != null)
			{
				rankingtable.destroy();
			}
			renderRanking(lastround, 1);
		}
		showTable(false);*/
	}


	function startScroll(){
		var list = '#ranking';

		if($('#list').is(':visible'))
		{
			list = '#list';
		}

		autoScroll(list);
		$('#iconplay').removeClass('glyphicon-play').addClass('glyphicon-pause');
		scrolling = true;
	}

	function stopScroll(){
		// stop scrolling
		$('#list table').parent().stop(true, false);
		$('#ranking table').parent().stop(true, false);
		$('#iconplay').removeClass('glyphicon-pause').addClass('glyphicon-play');
		scrolling = false;
		scrollDown = !scrollDown;
	}

	function autoScroll(list){
		var duration = 30000;
		if(scrollDown){
			$(list + ' table').parent().animate({scrollTop: 2500}, { "duration": duration, "easing": "linear", complete: function(){
				autoScroll(list);
			}});
			scrollDown = false;
		}
		else{
			$(list + ' table').parent().animate({scrollTop: -200}, { "duration": duration, "easing": "linear", complete: function(){
				autoScroll(list);
			}});
			scrollDown = true;
		}
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