var c = document.getElementById("c").getContext("2d");
var p=false, t=0, gs=10, w=40, h=40, x=X=20, y=Y=20, xv=0, yv=-1, s=S=6, l=L=5, g=[], m=0;
c.font="60px Helvetica, sans-serif";
setInterval(function() {
	try{
		t++;
		p || c.clearRect(0, 0, 400, 400);
		p || c.strokeText(l-L,10,390);
		for (var iy=0;iy<h;iy++) {
			g[iy] || (g[iy] = []);
			for (var ix=0;ix<w;ix++) {
				g[iy][ix] || (g[iy][ix] = {t:0});
				g[iy][ix].t && (c.fillRect(ix*gs,iy*gs,gs,gs), g[iy][ix].t--);
				g[iy][ix].s && (c.strokeRect(ix*gs,iy*gs,gs,gs), g[iy][ix].s--);
			}
		}
		if (p) { return; }
		!(t%s) && (y+=yv, x+=xv, m=0 ,1) && (g[y][x].t && cra.sh ,1) && (g[y][x].s && (l++, g[y][x].s=0, 1) && !((l-L)%10) && s>1 && s-- ,1) && (g[y][x].t=l*s ,1);
		!(t%240) && (g[Math.random()*h|0][Math.random()*w|0].s=240);
	} catch (e) {
		p=true;
		c.strokeText("Game over!",40,210);
	}
}, 30);
document.onkeydown = function(e) {
	p && (!g[y-yv][x-xv].t || ex.it) && (p=false,x=X,y=Y,s=S,l=L);
	(m && ex.it) || (m=1);
	e.keyCode === 40 && yv!=-1 && (yv=1, xv=0);
	e.keyCode === 38 && yv!=1 && (yv=-1, xv=0);
	e.keyCode === 37 && xv!=1 && (yv=0, xv=-1);
	e.keyCode === 39 && xv!=-1 && (yv=0, xv=1);
};
