# WaterPhysicsSimulation
The project implements physics based rendering of fluid dynamics, creates and modifies 3d object, applies translucent shaders to the
mesh, and uses multiple integration methods.

View the animation by downloading the files and opening waterphysics.html in your webbrowser (works on chrome, but may not work for all browsers)

Important Buttons:

1. Background: Allows the user to change three different types of tiles. This feature
is locked when viewing the mesh from the side.

2. View: Choose a view from either the top or side of the mesh.

3. Translucent: Turns on and off the translucent shader. Enabling this feature allows
you to use a slider which increases or decreases transparency.

4. Poke: Pokes mesh where Poke Location is set.

5. Drop Box: Clicking this button drops a box in the middle of the mesh which
causes forces to be applied.

6. Toggle Rain: Activating this feature will drop small boxes randomly over the
whole mesh. When the boxes collide with the mesh a force is applied.

7. Integration Method: chooses which integration method to use (Euler's method (k=1), Leapfrog (k=2), or Runeg-Kutta 4 (k=4)). The k value is the order of the method. The error of the method is delta_t^k where delta_t is the timestep between frames.


Citations / Inspiration:

Background images: Zachary Difura

Cube Model Code: CS 112 Project 1

Shader Code: CS 114 Project 1

Mesh Code: CS 114 Project 3

Translucency: http://learnwebgl.brown37.net/11_advanced_rendering/alpha_blending.html

Runge-Kutta 4: https://www.intmath.com/differential-equations/12-runge-kutta-rk4-des.php
