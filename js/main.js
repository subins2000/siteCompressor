/* For debugging */
window.clog=function(m){
 return console.log(m);
};

/* Make an associative array of Forms' data */
$.fn.serializeHTML = function() {
    var formData = "";
    var formId   = $(this).attr("id");
    this.find('[name]').each(function() {
        name = $(this).attr("name");
        if(name.substr(-2, 2) == "[]"){
        	name = name.substr(0, name.length-2);   
        	formData+='<input name="'+ formId + "[" + name + "][]" + '" value="' + $(this).val() + '" type="text" />';
        }else{
        	if($(this).is(":checked")){
        		formData+='<input name="'+ formId + "[" + name + "]" + '" type="checkbox" checked="checked" />';
        	}else if($(this).attr("type") != "checkbox"){
        		formData+='<input name="'+ formId + "[" + name + "]" + '" value="' + $(this).val().replace(/"/g, "'") + '" type="text" />';
        	}
        }
    });
    clog(formData);
    return formData;
};

/* Restoring Configuration */
window.restoreConfig = function(configName){
 /* Get the config as JSON object */
 $replaceData = JSON.parse(localStorage[configName + "replacerConfig"]);
 $mainData    = JSON.parse(localStorage[configName + "mainConfig"]);
 
 /* Replacer Config */
 var replaceFields={};
 $("#replaceFields div").remove();
 $.each($replaceData, function(key, val){
 	$(".addReplaceField").click();
 	$("#replaceFields div:last").find("[name='replaceFrom[]']").val(key);
 	$("#replaceFields div:last").find("[name='replaceTo[]']").val(val);
 });
 
 /* Restore Site Details */
 $('.top [data-binding]').each(function(){ 
        // handle the set value
        // need consider the different value type for different field type
        var $this = $(this);
        var val = $mainData[$this.data('binding')];

         // for chechbox
        if($this.is('[type=checkbox]')){
            $this.prop('checked',val)
         // for others
        }else{
            $this.val(
             decodeURIComponent(
             	val.replace($this.attr("name") + "=", "")
             )
            );
        }
 });
 $("[name='beforeCommand'], [name='afterCommand']").each(function(){
 	$(this).val($(this).val().replace(/\+/g, " "));
 });
};

/* Save Configuration */
window.saveConfig = function(configName){
 	/* Save Site Details & Compression Options */
  	var data = {};
	$('.top [data-binding]').each(function(){
		data[$(this).data('binding')] = $(this).serialize();
	});
  	localStorage[configName + "mainConfig"] = JSON.stringify(data);
  	
  	/* Since Replacer may have mutiple fields according to user choice, we add each values one by one. */
  	var data = {};
  	if($("#siteDetails div").length != 0){
  		$("#siteDetails div").each(function(){
  			from = $(this).find("[name='replaceFrom[]']").val();
  			to = $(this).find("[name='replaceTo[]']").val();
  			if(from!="" && to!=""){
  				data[from] = to;
  			}
  		});
  		localStorage[configName + "replacerConfig"] = JSON.stringify(data);
  	}
  	var saves=typeof localStorage["SCMPSaves"] == "undefined" ? {} : JSON.parse(localStorage["SCMPSaves"]);
  	if(Object.keys(saves).length == 0){
  	 	var saves = {};
  	}
	saves[configName] = 1;
  	localStorage["SCMPSaves"] = JSON.stringify(saves);
}

window.displaySaves = function(){
 if(typeof localStorage["SCMPSaves"] != "undefined" && localStorage["SCMPSaves"] !="{}" ){
  	$("#configSaves").html("");
  	$.each(JSON.parse(localStorage["SCMPSaves"]), function(key){
  		$("#configSaves").append("<div style='margin:5px;' id='" + key + "'>" + key + " - " + "<a href='javascript:void(0);' class='loadConfig'>Load</a> <a href='javascript:void(0);' class='removeConfig'>Remove</a>" + "</div>");
  	});
 }else{
 	$("#configSaves").html("No Saves Found");
 }
};

$(document).ready(function(){
 localStorage["lastSaveName"] = "";
 
 /* Add Dynamic Srollbars */
 $(".left, .right, .content").addClass("scrollbar-inner").scrollbar();
 $(".table .left:first, .table .right:first").width(($(document).width()/2)-10);
 
 /* Display the saved configs */
 displaySaves();
 
 /* Load Config when requested */
 $(".loadConfig").live("click", function(){
 	id = $(this).parent().attr("id");
  	localStorage["lastSaveName"] = id;
  	restoreConfig(id);
 });
 
 /* Remove Config when requested */
 $(".removeConfig").live("click", function(){
 	configName = $(this).parent().attr("id");
 	var saves=typeof localStorage["SCMPSaves"] == "undefined" ? {} : JSON.parse(localStorage["SCMPSaves"]);
  	if(Object.keys(saves).length == 0){
  	 	var saves = {};
  	}
  	localStorage.removeItem(configName + "replacerConfig");
  	localStorage.removeItem(configName + "mainConfig");
	delete saves[configName];
  	localStorage["SCMPSaves"] = JSON.stringify(saves);
  	/* Display the saves that are left */
  	displaySaves();
 });
 
 $("#siteDetails").live("submit", function(e){
  e.preventDefault();
  
  /* Make the fake form to be inserted in iframe */
  var formHTML = $("<form>").html(
   $("#options").serializeHTML() + $("#siteDetails").serializeHTML()
  ).attr({
   "method" : "POST",
   "action" : "compress.php"
  }).css("display", "none").wrap('<p>').parent().html();
  
  $(".content").html("");
  $("<iframe/>").attr({
    "height"      : ( $(document).height() - $(".top").height() ) - 15,
    "width"       : "100%",
    "frameborder" : 0,
  }).appendTo(".content");
  $(".content").find("iframe").contents().find("body").html(formHTML);
  $(".content").find("iframe").contents().find("body").find("form").submit();
 });
 $(".addReplaceField").live("click", function(){
  $(this).before("<div style='margin:5px;'><input name='replaceFrom[]' placeholder='From'><input name='replaceTo[]' style='margin-left:5px' placeholder='To'/></div>");
 });
 
 $("#saveConfig").live("click", function(){
 	var saveName = prompt("Name the configuration ?", localStorage["lastSaveName"]);
 	if(saveName != null){ /* If user didn't clicked cancel button */
 		if(saveName == ""){
 	 		saveName = "default";
 		}
 		localStorage["lastSaveName"] = saveName;
  		saveConfig(saveName);
  		displaySaves();
  		restoreConfig(saveName);
  	}
 });
});