/*
 * Rendering control
 */
function changeResolution(sel) {
    var id = parseInt(sel.value, 10);

    var width = 0, height = 0;
    switch ( id ) {
        case 0:
            width = 480; height = 640; break;

        case 1:
            width = 600; height = 800; break;

        case 2:
            width = 720; height = 960; break;

        default:
            alert("Unknown resolution!");
    }

    if ( width > 0 ) {
        var canvas = $("#canvas0")[0];
        
        canvas.width = width; 
        canvas.height = height;

        gl.viewportWidth = width;
        gl.viewportHeight = height;
    }
}


var currTile = 0;
var side = false;
function changeBackground(val) {
    if(side == true) return;
    var id = val; //parseInt(sel.value, 10);
    var back;
    var background1 = "background: url('floor_tile1.jpg')";
    var background2 = "background: url('floor_tile2.jpg')";
    var background3 = "background: url('floor_tile3.jpg')";
    var background4 = "background: url('side_tile1.jpg')";

        if(id == 0)
        {
            back = background1;
        }

        else if(id == 1){
                back = background2;
                }   

        else if(id == 2){
                back = background3;
                }
        else if(id == 3){
                back = background4;
               }
        else   alert("Unknown picture");

        var canvas = $("#canvas0")[0];
        canvas.style = back;
        if(id == 3) return;
        currTile = id;
        let element = document.getElementById('change');
        element.value = currTile;
        
}

function changeIntegationMethod(value){
    resetMesh();
    // 0 == Euler's, 1 == Leapfrog, 2 == RK4
    method_type = value;
}

function changeViewType(value){
    resetMesh();
    if(value == 0){
        changeBackground(3);
        side = true;
    }
    else if(value == 1)
    {
        side = false;
        changeBackground(currTile);
    }

    view_type = value;
 
}


function changeMode(value) {
    drawMode = parseInt(value, 10);
}

function changeRotatingState(ifRotating) {
    rotating = ifRotating;
    $("#sliderBar").prop("disabled", !rotating);
}

function updateSlider(sliderAmount) {
    $("#sliderAmount").html(sliderAmount*10);
    rotSpeed = sliderAmount*10.0;
}

function changeAnimatedLightState(ifAnimated) {
    rotating_light = ifAnimated;
    $("#sliderBarLight").prop("disabled", !rotating_light);
}

function updateSliderLight(sliderAmount) {
    var value = sliderAmount*10.0;
    $("#sliderAmountLight").html(value);
    rotSpeed_light = value;
}

function updateSliderMass(sliderAmount) {
    var value = sliderAmount*0.1;
    $("#sliderAmountMass").html(value.toFixed(1));
    mass = value;
}

function updateSliderK0(sliderAmount) {
    var value = sliderAmount*1000.0;
    $("#sliderAmountK0").html(sliderAmount);
    K[0] = value;
}

function updateSliderK1(sliderAmount) {
    var value = sliderAmount*1000.0;
    $("#sliderAmountK1").html(sliderAmount);
    K[1] = value;
}

function updateSliderK2(sliderAmount) {
    var value = sliderAmount*1000.0;
    $("#sliderAmountK2").html(sliderAmount);
    K[2] = value;
}

function updateSliderCd(sliderAmount) {
    var value = sliderAmount*0.1;
    $("#sliderAmountCd").html(value.toFixed(1));
    Cd = value;
}


/*
 * Animation control
 */
function changeMeshResolution(value) {
    var id = parseInt(value, 10);
    switch ( id ) {
    case 1:
        meshResolution = 15;
        poke_locat_x = meshResolution*.5;
		poke_locat_y = meshResolution*.5;
		break;
    case 2:
        meshResolution = 25; 
        poke_locat_x = meshResolution*.5;
		poke_locat_y = meshResolution*.5;
		break;
    case 3:
        meshResolution = 35; 
        poke_locat_x = meshResolution*.5;
		poke_locat_y = meshResolution*.5;
		break;
    }
    initMesh();
    initBuffers(false);
}

function changeAnimatedState(value) {
    animated = value;
}



function applyPoke() {
    doPoke();
}

function changePokeLocat(value) {
    if(value ==0){
        //Middle
        poke_locat_x = meshResolution*.5;
        poke_locat_y = meshResolution*.5;
    }
    if(value ==1){
        //Upper Left
        poke_locat_x = meshResolution*.25;
        poke_locat_y = meshResolution*.75;
    }
    if(value ==2){
        //Upper Right
        poke_locat_x = meshResolution*.75;
        poke_locat_y = meshResolution*.75;
    }
    if(value ==3){
        //Lower Left
        poke_locat_x = meshResolution*.25;
        poke_locat_y = meshResolution*.25;
    }
    if(value ==4){
        //Lower Right
        poke_locat_x = meshResolution*.75;
        poke_locat_y = meshResolution*.25;
    }
}

function changePokeForce(sliderAmount) {
    var value = sliderAmount*0.1;
    $("#sliderPokeForce").html(value.toFixed(1));
    pokeS = value;
}

function changeTranslucent(value) {
    translucent = value;
    console.log(shaderPrograms_arr[0]);
    console.log(shaderPrograms_arr[1]);
    if(translucent){
        shaderProgram = shaderPrograms_arr[1];
    }else{
        shaderProgram = shaderPrograms_arr[0];
    }
}

function changePokeArea(sliderAmount){
    var value = sliderAmount;
    $("#sliderPokeArea").html(value);
    pokeArea = value;
}

function changePokeTime(sliderAmount){
    var value = sliderAmount;
    $("#sliderPokeTime").html(value);
    poke_time = value;
}

function updateSlider_LightPower(sliderAmount) {
    var value = sliderAmount/2.0;
    $("#sliderAmount_LightPower").html(value);
    lightPower = value;
}

function updateSlider_Ambient(sliderAmount) {
    var value = sliderAmount/100.0;
    $("#sliderAmount_Ambient").html(value);
    ambientIntensity = value;
}

function updateSlider_BlinnPhongExp(sliderAmount) {
    var value = sliderAmount*5;
    $("#sliderAmount_BlinnPhongExp").html(value);
    gl.useProgram(shaderPrograms_arr[0]);
    gl.uniform1f(shaderPrograms_arr[0].exponentUniform, value);
}

function updateSlider_TranspAlpha(sliderAmount) {
    var value = sliderAmount*.1;
    $("#sliderAmount_TranspAlpha").html(value.toFixed(1));
    gl.useProgram(shaderPrograms_arr[1]);
    gl.uniform1f(shaderPrograms_arr[1].alphaUniform, value);
}

function changeDrop(){
    dropBox();
}

function updateSlider_BoxMass(sliderAmount){
    var value = sliderAmount*0.1;
    $("#sliderAmount_BoxMass").html(value.toFixed(1));
    box_mass = value;
}

function toggleRain(value){
    raining = value;
}

function updateSlider_Raininess(sliderAmount){
    var value = sliderAmount;
    $("#sliderAmount_Raininess").html(value);
    raininess = value;
}

function updateSliderDropletMass(sliderAmount) {
    var value = sliderAmount*0.1;
    $("#sliderAmountDropletMass").html(value.toFixed(1));
    droplet_mass = value;
}


/*
 * Page-load handler
 */
$(function() {
    var colorPalette = [
        ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
        ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
        ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
        ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
        ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
        ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
        ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
        ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
    ];

    $("#colorPickerDiff").spectrum({
        color: "#3d85c6",
        showPaletteOnly: true,
        togglePaletteOnly: true,
        hideAfterPaletteSelect: true,
        palette: colorPalette,
        change: function(color) {
            var color_ = color.toRgb();
            $("#colorTextDiff").html(color.toHexString());
            diffuseColor = [color_.r/255.0, color_.g/255.0, color_.b/255.0];
        }        
    });
    $("#colorPickerSpec").spectrum({
        color: "#ffffff",
        showPaletteOnly: true,
        togglePaletteOnly: true,
        hideAfterPaletteSelect: true,
        palette: colorPalette,
        change: function(color) {
            var color_ = color.toRgb();
            $("#colorTextSpec").html(color.toHexString());
            specularColor = [color_.r/255.0, color_.g/255.0, color_.b/255.0];
        }        
    });
    webGLStart();
});
