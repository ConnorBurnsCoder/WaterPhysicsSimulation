/*
 * Global variables
 */
var meshResolution;

// Particle states
var mass;
var vertexPosition, vertexNormal;
var vertexVelocity;

// Spring properties
var K, restLength; 

// Force parameters
var Cd;

//my poke vars
var poke_time;
var pokeScaler = 2000;
var scaler_focusness = 5;
var poke_counter;
var pokeS;
var pokeArea;
var pokeF;
var max_poke_area = 6;
var poke_locat_x;
var poke_locat_y;

//my integration method vars
// 0 == Euler's, 1 == Leapfrog, 2 == RK4
var method_type = 0;
var new_sim = true;

//my view vars
var view_type;
var translucent;

//my collision vars
//box
var box_mass;
var boxScaler = 1000;
var my_cube = cube();
var dropping = false;
var raining;
var raininess;
var rainScaler = 2000;
var droplet_mass;
var extra_size_box;
var extra_index_box;
var box_start;
var box_index_start;
var fall_speed = .01;
var box_velocity = vec3.create([0.,0.,0.]);
var box_in_contact = false;

//rain
//only works with max_droplets = 1
var max_droplets = 100;
var my_droplet = droplet();
var extra_size_droplet;
var extra_index_droplet;
var droplet_start;
var droplet_index_start;
var droplet_dropping_arr;
//array of vec3 that use the first two positions to indicate the nearest droplet location on the mesh, and 3rd to incicate mass, if it is -1 then there is not contact
var droplet_contact_arr;

/*
 * Getters and setters
 */
function getPosition(i, j) {
    var id = i*meshResolution + j;
    return vec3.create([vertexPosition[3*id], vertexPosition[3*id + 1], vertexPosition[3*id + 2]]);
}

function setPosition(i, j, x) {
    var id = i*meshResolution + j;
    vertexPosition[3*id] = x[0]; vertexPosition[3*id + 1] = x[1]; vertexPosition[3*id + 2] = x[2];
}

function getNormal(i, j) {
    var id = i*meshResolution + j;
    return vec3.create([vertexNormal[3*id], vertexNormal[3*id + 1], vertexNormal[3*id + 2]]);
}

function getVelocity(i, j) {
    var id = i*meshResolution + j;
    return vec3.create(vertexVelocity[id]);
}

function setVelocity(i, j, v) {
    var id = i*meshResolution + j;
    vertexVelocity[id] = vec3.create(v);
}


/*
 * Provided global functions (you do NOT have to modify them)
 */
function computeNormals() {
    var dx = [1, 1, 0, -1, -1, 0], dy = [0, 1, 1, 0, -1, -1];
    var e1, e2;
    var i, j, k = 0, t;
    for ( i = 0; i < meshResolution; ++i )
        for ( j = 0; j < meshResolution; ++j ) {
            var p0 = getPosition(i, j), norms = [];
            for ( t = 0; t < 6; ++t ) {
                var i1 = i + dy[t], j1 = j + dx[t];
                var i2 = i + dy[(t + 1) % 6], j2 = j + dx[(t + 1) % 6];
                if ( i1 >= 0 && i1 < meshResolution && j1 >= 0 && j1 < meshResolution &&
                     i2 >= 0 && i2 < meshResolution && j2 >= 0 && j2 < meshResolution ) {
                    e1 = vec3.subtract(getPosition(i1, j1), p0);
                    e2 = vec3.subtract(getPosition(i2, j2), p0);
                    norms.push(vec3.normalize(vec3.cross(e1, e2)));
                }
            }
            e1 = vec3.create();
            for ( t = 0; t < norms.length; ++t ) vec3.add(e1, norms[t]);
            vec3.normalize(e1);
            vertexNormal[3*k] = e1[0];
            vertexNormal[3*k + 1] = e1[1];
            vertexNormal[3*k + 2] = e1[2];
            ++k;
        }
}


var clothIndex;
var clothWireIndex = [];

function initMesh() {
    var i, j, k;
    new_sim = true;
    //also add the box and droplets to the mesh arrays
    poke_counter = -1;
    //extra size and index per box
    extra_size_box = my_cube.vertexPositions.length;
    extra_index_box = my_cube.indices.length;
    box_start = (meshResolution*meshResolution*3);
    box_index_start = (meshResolution - 1)*(meshResolution - 1)*6;
    //extra size and index for all droplets
    extra_size_droplet = my_droplet.vertexPositions.length*max_droplets;
    extra_index_droplet = my_droplet.indices.length*max_droplets;
    droplet_start = (meshResolution*meshResolution*3)+extra_size_box;
    droplet_index_start = ((meshResolution - 1)*(meshResolution - 1)*6)+extra_index_box;

    vertexPosition = new Array((meshResolution*meshResolution*3)+extra_size_box+extra_size_droplet);
    vertexNormal = new Array((meshResolution*meshResolution*3)+extra_size_box+extra_size_droplet);
    clothIndex = new Array(((meshResolution - 1)*(meshResolution - 1)*6)+extra_index_box+extra_index_droplet);

    vertexVelocity = new Array(meshResolution*meshResolution);
    restLength[0] = 4.0/(meshResolution - 1);
    restLength[1] = Math.sqrt(2.0)*4.0/(meshResolution - 1);
    restLength[2] = 2.0*restLength[0];

    for ( i = 0; i < meshResolution; ++i )
        for ( j = 0; j < meshResolution; ++j ) {
            setPosition(i, j, [-2.0 + 4.0*j/(meshResolution - 1), -2.0 + 4.0*i/(meshResolution - 1), 0.0]);
            setVelocity(i, j, vec3.create());

            if ( j < meshResolution - 1 )
                clothWireIndex.push(i*meshResolution + j, i*meshResolution + j + 1);
            if ( i < meshResolution - 1 )
                clothWireIndex.push(i*meshResolution + j, (i + 1)*meshResolution + j);
            if ( i < meshResolution - 1 && j < meshResolution - 1 )
                clothWireIndex.push(i*meshResolution + j, (i + 1)*meshResolution + j + 1);
        }
    computeNormals();

    k = 0;
    for ( i = 0; i < meshResolution - 1; ++i )
        for ( j = 0; j < meshResolution - 1; ++j ) {
            clothIndex[6*k] = i*meshResolution + j;
            clothIndex[6*k + 1] = i*meshResolution + j + 1;
            clothIndex[6*k + 2] = (i + 1)*meshResolution + j + 1;
            clothIndex[6*k + 3] = i*meshResolution + j;
            clothIndex[6*k + 4] = (i + 1)*meshResolution + j + 1;            
            clothIndex[6*k + 5] = (i + 1)*meshResolution + j;
            ++k;
        }
    init_box_mesh();
    add_droplets();
}

function add_droplets(){
    //adds max_droplets number of droplets to vertexPosition, vertexNormal, and clothIndex
    //array indicates if the droplets are currently dropping or are availible
    droplet_dropping_arr = new Array(max_droplets);
    //an array containing vec3 for the coordinates the droplet is dropping toward
    droplet_contact_arr = new Array(max_droplets);

    var j,i;
    for(j=0;j<max_droplets;++j){
        for(i = 0; i < my_droplet.vertexPositions.length; ++i){
        vertexPosition[i+droplet_start+my_droplet.vertexPositions.length*j] = my_droplet.vertexPositions[i];
        }
        for(i = 0; i < my_droplet.vertexNormals.length; ++i){
            vertexNormal[i+droplet_start+my_droplet.vertexNormals.length*j] = my_droplet.vertexNormals[i];
        }
        for(i = 0; i < my_droplet.indices.length; ++i){
            clothIndex[i+droplet_index_start+my_droplet.indices.length*j] = my_droplet.indices[i]+(droplet_start+my_droplet.vertexPositions.length*j)/3;
        }
        droplet_dropping_arr[j] = 0;
        droplet_contact_arr[j] = vec3.create([0,0,0]);
        hide_droplet(j);
    }
}


function init_box_mesh(){
    //only works with nonwire index 
    //modifies vertexPosition, vertexNormal, and clothIndex
    var i;
    for(i = 0; i < my_cube.vertexPositions.length; ++i){
        vertexPosition[i+box_start] = my_cube.vertexPositions[i];
    }
    for(i = 0; i < my_cube.vertexNormals.length; ++i){
        vertexNormal[i+box_start] = my_cube.vertexNormals[i];
    }
    for(i = 0; i < my_cube.indices.length; ++i){
        clothIndex[i+box_index_start] = my_cube.indices[i]+box_start/3;
    }
    hide_box();
}

function set_box_position(new_pos){
    //sets the box position where new_pos is a vec3
    for(i = 0; i < my_cube.vertexPositions.length; i+=3){
        vertexPosition[i+box_start] = my_cube.vertexPositions[i]+new_pos[0];
        vertexPosition[i+box_start+1] = my_cube.vertexPositions[i+1]+new_pos[1];
        vertexPosition[i+box_start+2] = my_cube.vertexPositions[i+2]+new_pos[2];
    }
}

function get_box_position(){
    //returns the center of the box position as a vec3
    return vec3.create([vertexPosition[0+box_start]-my_cube.vertexPositions[0],
    vertexPosition[1+box_start]-my_cube.vertexPositions[1],
    vertexPosition[2+box_start]-my_cube.vertexPositions[2]]);
}


function reset_box(){
    //resets the box by putting it in the default position and reseting its velocity
    box_velocity = vec3.create([0.,0.,0.]);
    set_box_position(vec3.create([0,0,0]));

}

function hide_box(){
    //hides the box by moving it offscreen behind the camera
    reset_box()
    set_box_position(vec3.create([15,15,15]));
}

function dropBox(){
    //drops box from above if view_type ==0, else drops from in front if view_type == 1
    //box has a constant velocity
    dropping = true;
    var i;
    if(view_type ==0){
        //side
        set_box_position(vec3.create([0,2.7,-.07]));
        box_velocity = vec3.create([0,-1*fall_speed,0])
    }if(view_type==1){
        //top
        set_box_position(vec3.create([0,0,2]));
        box_velocity = vec3.create([0,0,-1*fall_speed])
    }
}



function box_update(){
    //updates box position, and checks if it made contact every frame
    var X = get_box_position();
    if(view_type ==1){
        //top view
        if(X[2]<-.1){
            //hide box and apply box force for one round of simulation
            box_in_contact = true;
            hide_box();
        }else{
            //box keeps falling
            set_box_position(vec3.add(X,box_velocity));
        }
    }if(view_type ==0){
        //side view
        if(X[1]<1.9){
            //hide box and apply box force for one round of simulation
            box_in_contact = true;
            hide_box();
        }else{
            //box keeps falling
            set_box_position(vec3.add(X,box_velocity));
        }
    }
}

function getFb(i,j){
    //returns the force from the box hitting at that location
    if(box_in_contact){
        if(view_type ==0){
            scaler = getscaler_local(i,j,meshResolution-1,meshResolution/2,6,1);
            return vec3.scale(vec3.create([0,-1*gravity*box_mass*boxScaler, 0]), scaler);
        }if(view_type ==1){
            scaler = getscaler_local(i,j,meshResolution/2,meshResolution/2,6,1);
            return vec3.scale(vec3.create([0,0,-1*gravity*box_mass*boxScaler]), scaler);
        }
    }else{
        return vec3.create([0,0,0]);
    }
}

function getFs_indiv(i,j,p,type){
    //helper function to get an individual spring force
    if(i >=0 && j>=0 && i<=meshResolution-1 && j<=meshResolution-1){
        var p_q = vec3.subtract(vec3.create(p),getPosition(i, j));
        var p_q_len = vec3.length(p_q);
        p_q = vec3.normalize(p_q);
        return vec3.scale(p_q , (K[type]*(restLength[type] - p_q_len)));
    } else{
        return vec3.create([0.,0.,0.]);
    }
}

function getFs_struct(i,j){
    var Fs = vec3.create([0.,0.,0.]);
    vec3.add(Fs, getFs_indiv(i,j+1,getPosition(i, j),0));
    vec3.add(Fs, getFs_indiv(i,j-1,getPosition(i, j),0));
    vec3.add(Fs, getFs_indiv(i+1,j,getPosition(i, j),0));
    vec3.add(Fs, getFs_indiv(i-1,j,getPosition(i, j),0));
    return Fs;
}

function getFs_shear(i,j){
    var Fs = vec3.create([0.,0.,0.]);
    vec3.add(Fs, getFs_indiv(i+1,j+1,getPosition(i, j),1));
    vec3.add(Fs, getFs_indiv(i+1,j-1,getPosition(i, j),1));
    vec3.add(Fs, getFs_indiv(i-1,j-1,getPosition(i, j),1));
    vec3.add(Fs, getFs_indiv(i-1,j+1,getPosition(i, j),1));
    return Fs;
}

function getFs_flex(i,j){
    var Fs = vec3.create([0.,0.,0.]);
    vec3.add(Fs, getFs_indiv(i,j+2,getPosition(i, j),2));
    vec3.add(Fs, getFs_indiv(i,j-2,getPosition(i, j),2));
    vec3.add(Fs, getFs_indiv(i+2,j,getPosition(i, j),2));
    vec3.add(Fs, getFs_indiv(i-2,j,getPosition(i, j),2));
    return Fs;
}

function getscaler_local(i,j,loc_y, loc_x, max_area, area){
    //helper function to get the scaler based on distance from the center of the force
    var d = Math.sqrt(Math.pow(j-loc_x,2)+Math.pow(i-loc_y,2));
    var d_max = Math.sqrt(Math.pow(meshResolution-0,2)+Math.pow(meshResolution-0,2));
    var focused = Math.pow(1-d/d_max,scaler_focusness);
    //can do decimals for area
    return Math.pow(focused,max_area/(area));
}

function getFp(i,j,poke_counter){
    //get the force from a poke a certain point
    var scaler;
    var Fp = vec3.create([0.,0., 0.]);
    if(poke_counter >= 0){
        if(view_type ==0){
            scaler = getscaler_local(i,j,meshResolution-1,poke_locat_x,max_poke_area,pokeArea);
            vec3.add(Fp, vec3.scale(vec3.create(pokeF), scaler));
        }if(view_type ==1){
            scaler = getscaler_local(i,j,poke_locat_y,poke_locat_x,max_poke_area,pokeArea);
            vec3.add(Fp, vec3.scale(vec3.create(pokeF), scaler));
        }
    }
    return Fp;
}

function getFr(i,j){
    //get the force from rain a certain point
    var scaler;
    var Fr = vec3.create([0.,0., 0.]);
    var rainArea = 1;
    var max_rain_area = 6;
    var k,contact;
    for(k=0;k<max_droplets;++k){
        contact = droplet_contact_arr[k];
        if(contact[2] ==1 ){
            //droplet i makes contact with mesh
            if(view_type ==0){
                scaler = getscaler_local(i,j,meshResolution-1,contact[0],max_rain_area,rainArea)*droplet_mass;
                vec3.add(Fr, vec3.scale(vec3.create([0.,-1.0*rainScaler, 0.]), scaler));
            }if(view_type ==1){
                scaler = getscaler_local(i,j,contact[1],contact[0],max_rain_area,rainArea)*droplet_mass;
                console.log(scaler);
                vec3.add(Fr, vec3.scale(vec3.create([0.,0., -1.0*rainScaler]), scaler));
            }
        }
    }
    return Fr;
}

function sim_rain(){
    //drops droplets and calls update on them
    //there a a chance that a drop can happen if their are also enough droplets not currently falling
    var i;
    var d_num_free = -1;
    for(i=0;i<max_droplets;++i){
        if(droplet_dropping_arr[i] == 0){
            d_num_free = i;
        }

    }
    if(d_num_free != -1 && Math.random()*1000<raininess){
        //random location x and y between 0 and meshResolution-1
        var rain_x = Math.floor(Math.random()*(meshResolution-1));
        var rain_y = Math.floor(Math.random()*(meshResolution-1));
        dropDroplet(d_num_free, rain_x, rain_y);
        
    }
    droplets_update();

}

function reset_droplet_contact(){
    //resets the contact array after the force has been applied to the mesh
    var i,contact;
    for(i=0;i<max_droplets; ++i){
        contact = droplet_contact_arr[i];
        droplet_contact_arr[i] = vec3.create([contact[0],contact[1],0]);
    }
}

function set_droplet_position(d_num, new_pos){
    //sets the d_num numbered droplet position where new_pos is a vec3
    for(i = 0; i < my_droplet.vertexPositions.length; i+=3){
        vertexPosition[i+droplet_start+d_num*my_droplet.vertexPositions.length] = my_droplet.vertexPositions[i]+new_pos[0];
        vertexPosition[i+droplet_start+d_num*my_droplet.vertexPositions.length+1] = my_droplet.vertexPositions[i+1]+new_pos[1];
        vertexPosition[i+droplet_start+d_num*my_droplet.vertexPositions.length+2] = my_droplet.vertexPositions[i+2]+new_pos[2];
    }
}

function get_droplet_position(d_num){
    //returns the center of d_num numbered droplet position as a vec3
    return vec3.create([vertexPosition[0+droplet_start+d_num*my_droplet.vertexPositions.length]-my_droplet.vertexPositions[0],
    vertexPosition[1+droplet_start+d_num*my_droplet.vertexPositions.length]-my_droplet.vertexPositions[1],
    vertexPosition[2+droplet_start+d_num*my_droplet.vertexPositions.length]-my_droplet.vertexPositions[2]]);
}

function reset_droplet(d_num){
    //resets the droplet by putting it in the default position and reseting its velocity
    set_droplet_position(d_num, vec3.create([0,0,0]));
    droplet_dropping_arr[d_num] = 0;

}

function hide_droplet(d_num){
    //hides the droplet by moving it offscreen behind the camera
    reset_droplet(d_num);
    set_droplet_position(d_num, vec3.create([15,15,15]));
}

function dropDroplet(d_num,x_cord , y_cord){
    //starts dropping droplet dnum at mesh coordinates x_cord and y_cord
    //drops box from above if view_type ==0, else drops from in front if view_type == 1
    //box has a constant velocity

    droplet_dropping_arr[d_num] = 1;
    var x_cord_world = x_cord/((meshResolution-1)/4)-2;
    var y_cord_world = y_cord/((meshResolution-1)/4)-2;
    if(view_type ==0){
        //side
        droplet_contact_arr[d_num] = vec3.create([x_cord,0,0]);
        set_droplet_position(d_num,vec3.create([x_cord_world,2.7,-.03]));
        
    }if(view_type==1){
        //top
        droplet_contact_arr[d_num] = vec3.create([x_cord,y_cord,0]);
        set_droplet_position(d_num, vec3.create([x_cord_world,y_cord_world,2]));
    }
}

function droplets_update(){
    //updates droplest position and checks if they make contact with mesh
    var i,X,contact;
    for(i=0;i<max_droplets;++i){
        if(droplet_dropping_arr[i] == 1){
            X = get_droplet_position(i);
            if(view_type ==1){
                //top view
                if(X[2]<-.1){
                    //hide droplet and update droplet_contact_arr to apply droplet force for one round of simulation
                    contact = droplet_contact_arr[i];
                    droplet_contact_arr[i] = vec3.create([contact[0],contact[1],1]);
                    hide_droplet(i);
                }else{
                    //droplet keeps falling
                    set_droplet_position(i,vec3.add(X,vec3.create([0,0,-1*fall_speed])));
                }
            }if(view_type ==0){
                //side view
                if(X[1]<1.9){
                    //hide droplet and update droplet_contact_arr to apply droplet force for one round of simulation
                    contact = droplet_contact_arr[i];
                    droplet_contact_arr[i] = vec3.create([contact[0],contact[1],1]);
                    hide_droplet(i);
                }else{
                    //droplet keeps falling
                    set_droplet_position(i,vec3.add(X,vec3.create([0,-1*fall_speed,0])));
                }
            }
        }
    }
}

function simulate_euler(stepSize) {
    //simulate one time-step using Euler's method
    var i,j, X, V, n, Fd, Fs_struct, Fs_shear, Fs_flex, F_net, Fp,Fb;
    var a_arr = new Array(meshResolution*meshResolution);
    if(raining == 1){
        sim_rain();
    }if(dropping == true){
        box_update();
    }
    for(i=0;i<meshResolution;++i){
        for(j=0;j<meshResolution;++j){
            X = getPosition(i, j);
            V = getVelocity(i, j);
            n = getNormal(i,j);
            Fd = vec3.scale(vec3.create(V), -1.0*Cd);
            //poke force
            Fp = getFp(i,j,poke_counter);
            //rain force
            Fr = getFr(i,j);
            //box force
            Fb = getFb(i,j);
            Fs_struct = getFs_struct(i,j);
            Fs_shear = getFs_shear(i,j);
            Fs_flex = getFs_flex(i,j);
            //in place addition
            F_net = vec3.create([0.,0.,0.]);;
            vec3.add(F_net, Fd);
            vec3.add(F_net, Fp);
            vec3.add(F_net, Fr);
            vec3.add(F_net, Fb);
            vec3.add(F_net, Fs_struct);
            vec3.add(F_net, Fs_shear);
            vec3.add(F_net, Fs_flex);
            F_net = vec3.scale(F_net, 1/mass);
            a_arr[i*meshResolution+j] = F_net;
        }
    }
    poke_counter--;
    //stop anythin that should happen for one simulation
    box_in_contact = false;
    reset_droplet_contact();

    var X,V,id;
    for(i=0;i<meshResolution;++i){
        for(j=0;j<meshResolution;++j){
            if(view_type ==0 && !((i == 0) || (j == 0) || (j == meshResolution-1))){
                //pins sides and bottom for side view
                //compute force for all of particles first, then update their positions and velocities
                X = getPosition(i, j);
                V = getVelocity(i, j);
                setVelocity(i,j, vec3.add(vec3.create(V), vec3.scale(vec3.create(a_arr[(i*meshResolution+j)]),stepSize)));
                V = getVelocity(i, j);
                setPosition(i,j, vec3.add(vec3.create(X), vec3.scale(vec3.create(V),stepSize)));
                
            }else{
                if(view_type ==1 && !((i == 0) || (i == meshResolution-1) || (j == 0) || (j == meshResolution-1))){
                    //sides are pinned
                    //compute force for all of particles first, then update their positions and velocities
                    X = getPosition(i, j);
                    V = getVelocity(i, j);
                    setVelocity(i,j, vec3.add(vec3.create(V), vec3.scale(vec3.create(a_arr[(i*meshResolution+j)]),stepSize)));
                    V = getVelocity(i, j);
                    setPosition(i,j, vec3.add(vec3.create(X), vec3.scale(vec3.create(V),stepSize)));
                    
                }
            }
        }
    }
}

function simulate_leapfrog(stepSize) {
    //simulate one time-step using leapfrog method
    var i,j, X, V, n, Fd, Fs_struct, Fs_shear, Fs_flex, F_net, Fp,Fb;
    var a_arr = new Array(meshResolution*meshResolution);
    if(raining == 1){
        sim_rain();
    }if(dropping == true){
        box_update();
    }
    if (new_sim){
        //todo
        //set v0.5
        new_sim = false
    }
    for(i=0;i<meshResolution;++i){
        for(j=0;j<meshResolution;++j){
            X = getPosition(i, j);
            V = getVelocity(i, j);
            n = getNormal(i,j);
            Fd = vec3.scale(vec3.create(V), -1.0*Cd);
            //poke force
            Fp = getFp(i,j,poke_counter);
            //rain force
            Fr = getFr(i,j);
            //box force
            Fb = getFb(i,j);
            Fs_struct = getFs_struct(i,j);
            Fs_shear = getFs_shear(i,j);
            Fs_flex = getFs_flex(i,j);
            //in place addition
            F_net = vec3.create([0.,0.,0.]);;
            vec3.add(F_net, Fd);
            vec3.add(F_net, Fp);
            vec3.add(F_net, Fr);
            vec3.add(F_net, Fb);
            vec3.add(F_net, Fs_struct);
            vec3.add(F_net, Fs_shear);
            vec3.add(F_net, Fs_flex);
            F_net = vec3.scale(F_net, 1/mass);
            a_arr[i*meshResolution+j] = F_net;
        }
    }
    poke_counter--;
    //stop anythin that should happen for one simulation
    box_in_contact = false;
    reset_droplet_contact();

    var X,V,id;
    for(i=0;i<meshResolution;++i){
        for(j=0;j<meshResolution;++j){
            if(view_type ==0 && !((i == 0) || (j == 0) || (j == meshResolution-1))){
                //pins sides and bottom for side view
                //compute force for all of particles first, then update their positions and velocities
                X = getPosition(i, j);
                V = getVelocity(i, j);
                setVelocity(i,j, vec3.add(vec3.create(V), vec3.scale(vec3.create(a_arr[(i*meshResolution+j)]),stepSize)));
                V = getVelocity(i, j);
                setPosition(i,j, vec3.add(vec3.create(X), vec3.scale(vec3.create(V),stepSize)));
                
            }else{
                if(view_type ==1 && !((i == 0) || (i == meshResolution-1) || (j == 0) || (j == meshResolution-1))){
                    //sides are pinned
                    //compute force for all of particles first, then update their positions and velocities
                    X = getPosition(i, j);
                    V = getVelocity(i, j);
                    setVelocity(i,j, vec3.add(vec3.create(V), vec3.scale(vec3.create(a_arr[(i*meshResolution+j)]),stepSize)));
                    V = getVelocity(i, j);
                    setPosition(i,j, vec3.add(vec3.create(X), vec3.scale(vec3.create(V),stepSize)));
                    
                }
            }
        }
    }
}

function simulate_rk4(stepSize) { 
    //simulate one time-step using RK4 method
    //todo fix
    var i,j, X, V, n, Fd, Fs_struct, Fs_shear, Fs_flex, F_net, Fp,Fb;
    var a_arr = new Array(meshResolution*meshResolution);
    if(raining == 1){
        sim_rain();
    }if(dropping == true){
        box_update();
    }
    for(i=0;i<meshResolution;++i){
        for(j=0;j<meshResolution;++j){
            X = getPosition(i, j);
            V = getVelocity(i, j);
            n = getNormal(i,j);
            Fd = vec3.scale(vec3.create(V), -1.0*Cd);
            //poke force
            Fp = getFp(i,j,poke_counter);
            //rain force
            Fr = getFr(i,j);
            //box force
            Fb = getFb(i,j);
            Fs_struct = getFs_struct(i,j);
            Fs_shear = getFs_shear(i,j);
            Fs_flex = getFs_flex(i,j);
            //in place addition
            F_net = vec3.create([0.,0.,0.]);;
            vec3.add(F_net, Fd);
            vec3.add(F_net, Fp);
            vec3.add(F_net, Fr);
            vec3.add(F_net, Fb);
            vec3.add(F_net, Fs_struct);
            vec3.add(F_net, Fs_shear);
            vec3.add(F_net, Fs_flex);
            F_net = vec3.scale(F_net, 1/mass);
            a_arr[i*meshResolution+j] = F_net;
        }
    }
    poke_counter--;
    //stop anythin that should happen for one simulation
    box_in_contact = false;
    reset_droplet_contact();

    var X,V,id;
    for(i=0;i<meshResolution;++i){
        for(j=0;j<meshResolution;++j){
            if(view_type ==0 && !((i == 0) || (j == 0) || (j == meshResolution-1))){
                //pins sides and bottom for side view
                //compute force for all of particles first, then update their positions and velocities
                X = getPosition(i, j);
                V = getVelocity(i, j);
                setVelocity(i,j, vec3.add(vec3.create(V), vec3.scale(vec3.create(a_arr[(i*meshResolution+j)]),stepSize)));
                V = getVelocity(i, j);
                setPosition(i,j, vec3.add(vec3.create(X), vec3.scale(vec3.create(V),stepSize)));
                
            }else{
                if(view_type ==1 && !((i == 0) || (i == meshResolution-1) || (j == 0) || (j == meshResolution-1))){
                    //sides are pinned
                    //compute force for all of particles first, then update their positions and velocities
                    X = getPosition(i, j);
                    V = getVelocity(i, j);
                    setVelocity(i,j, vec3.add(vec3.create(V), vec3.scale(vec3.create(a_arr[(i*meshResolution+j)]),stepSize)));
                    V = getVelocity(i, j);
                    setPosition(i,j, vec3.add(vec3.create(X), vec3.scale(vec3.create(V),stepSize)));
                    
                }
            }
        }
    }
}

function simulate(stepSize) {
    if(method_type == 0){
        //Euler
        simulate_euler(stepSize)
    }
    if(method_type == 1){
        //Leapfrog
        simulate_leapfrog(stepSize)
    }
    if(method_type == 2){
        //RK4
        simulate_rk4(stepSize)
    }
}

function doPoke(){
    //sets the poke force to be used when calling getFp, poke counter is the number of frames to hold the poke
    poke_counter = poke_time;
    if(view_type==0){
        //side
        pokeF = vec3.create([0.,-1.0*pokeS*mass*pokeScaler, 0.]);
    }
    if(view_type==1){
        //top
        pokeF = vec3.create([0.,0., -1.0*pokeS*mass*pokeScaler]);
    }

}
