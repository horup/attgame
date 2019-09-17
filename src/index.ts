import * as Phaser from 'phaser';
import Vector2 = Phaser.Math.Vector2;

declare var require;

export interface Order
{
    moveTo:{x:number, y:number};
    facing:number;
    distance:number;
}

export class Unit extends Phaser.GameObjects.Sprite
{
    player:number = 0;
    fov:Phaser.Geom.Triangle = new Phaser.Geom.Triangle();
    ambient:Phaser.Geom.Circle = new Phaser.Geom.Circle();
    
    moveRadius = 4 * 16;
    shootRadius = 10 * 16;
    ambientRadius = 2 * 16;

    order:Order;

    focusDistance:number = 0;


    moveTo(x:number, y:number, rotation:number, focusDistance:number)
    {
        this.x = x;
        this.y = y;
        this.focusDistance = focusDistance;
        this.rotation = rotation;
        this.ambient.setTo(x, y, this.ambientRadius);
        this.fov = this.calculateFov(new Vector2(x, y), this.rotation, this.focusDistance);
    }

    calculateFov(from:Vector2, angle:number, distance:number)
    {
        let minDistance = 128;
        if (distance < minDistance)
            distance = minDistance;
        let l = distance;
        let l2 = 300 - l;
        let min = 0;
        if (l2 < min)
            l2 = min;
        let p = from.clone();
        let v = new Vector2(Math.cos(angle), Math.sin(angle));
        let to = v.clone().scale(distance).add(from);

        let p1 = v.clone().set(-v.y, v.x).scale(l2).add(to);
        let p2 = v.clone().set(v.y, -v.x).scale(l2).add(to);
        let tri = new Phaser.Geom.Triangle(p.x, p.y, p1.x, p1.y, p2.x, p2.y);
        return tri;
    }

    lookAt(p:Vector2)
    {
        let front = new Phaser.Geom.Triangle();
        let me = new Vector2(this);
        let v = p.clone().subtract(me);
        this.rotation = v.angle();
        let l = v.length();
        let l2 = 300-l;
        let min = 0;
        if (l2 < min)
            l2 = min;
        v.normalize();


        let p1 = v.clone().set(-v.y, v.x).scale(l2).add(p);
        let p2 = v.clone().set(v.y, -v.x).scale(l2).add(p);


        this.fov.setTo(me.x, me.y, p1.x, p1.y, p2.x, p2.y);
    }
}

export class AttScene extends Phaser.Scene
{
    constructor(config:any)
    {
        super(config);
    }

    init()
    {
    }

    preload()
    {
        this.load.spritesheet('units', require('../assets/spritesheet.png'), { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('tiles', require('../assets/basictiles.png'), { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('overlay', require('../assets/overlay.png'), { frameWidth: 16, frameHeight: 16 });
    }

    tilemap:Phaser.Tilemaps.Tilemap;
    last = {x:0, y:0};

    units:Unit[] = [];
    selectedUnit:Unit;
    
    fow:Phaser.GameObjects.Graphics;
    overlay:Phaser.GameObjects.Graphics;

    makeUnit(x:number, y:number, player = 0)
    {
        let u = new Unit(this, x, y, 'units', 0);
        u.player = player;
        this.children.add(u);
        u.setInteractive();
        this.units.push(u);

        u.moveTo(x, y, 0, 100);

        return u;
    }

    selectUnit(u:Unit)
    {
        this.selectedUnit = u;
       /* this.selectedUnit = u;
        this.fow.clear();
        this.graphics.clear();
        if (u == null)
            return;*/

       // this.fow.lineStyle(1, 0);
     /*   this.fow.strokeCircle(u.x,u.y, 12);
       // this.fow.fillStyle(0xFFFFFF);
        this.fow.fillCircle(u.x, u.y, u.ambientRadius);
        this.fow.fillTriangleShape(u.fov);

        this.fow.alpha = 0.5;
        
        this.graphics.fillStyle(0xFFFFFF);
        this.graphics.lineStyle(1, 0x0000FF, 0.5);
        this.graphics.strokeCircle(u.x, u.y, u.moveRadius);
        this.graphics.lineStyle(1, 0xFF0000, 0.5);
        this.graphics.strokeCircle(u.x, u.y, u.shootRadius);*/
    }

    currentTurn:Phaser.GameObjects.Text;
    turn = 1;
    endturn()
    {
        this.turn++;
        this.currentTurn.text = "Turn " + this.turn;
        for (let u of this.units)
        {
            if (u.order != null)
            {
                u.moveTo(u.order.moveTo.x, u.order.moveTo.y, u.order.facing, u.order.distance);
                u.order = null;
            }
        }
    }


    blackness:Phaser.GameObjects.Rectangle;
    create()
    {
        this.game.canvas.oncontextmenu = (e)=>e.preventDefault();

        this.tilemap = this.make.tilemap({tileHeight:16, tileWidth:16, width:256, height:256});
        this.tilemap.addTilesetImage('tiles');
        this.tilemap.addTilesetImage('units');
        this.tilemap.addTilesetImage('overlay');
        this.tilemap.createBlankDynamicLayer("ground", 'tiles').setInteractive().on('pointerdown', (e:PointerEvent)=>
        {
            if (e.button == 0)
                this.selectUnit(null);
            else if (e.button == 2)
            {
                if (this.selectedUnit != null)
                {
                    this.selectedUnit.order = {
                        distance:1,
                        facing:0,
                        moveTo:{x:e.x, y:e.y}
                    }
                    //this.selectedUnit.moveTo(e.x, e.y);
                }
            }
        })
        this.tilemap.createBlankDynamicLayer("unit", 'units');
        this.tilemap.createBlankDynamicLayer("overlay", 'overlay');
        this.tilemap.setLayer("ground");
        let size = 32;
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++)
                this.tilemap.putTileAt(11 + Phaser.Math.RND.integer() % 2, x, y);

        {
            let u = this.makeUnit(100, 100);
            u.on('pointerdown', (e:PointerEvent)=>e.button == 0 ? this.selectUnit(u) : undefined);
        }

        {
            let u = this.makeUnit(100, 400, 1);
            u.on('pointerdown', (e:PointerEvent)=>e.button == 0 ? this.selectUnit(u) : undefined);
        }


        this.fow = this.make.graphics({});

        this.blackness = this.add.rectangle(0, 0, 800, 800, 0x00);
        this.blackness.setOrigin(0, 0);


        this.overlay = this.add.graphics({lineStyle:{width:1}});

        this.currentTurn = this.add.text(8, 8, "Turn 1", 
        {
            fontSize:'32px',
            color:'red',
            align:'center',
            fontFamily: 'Tahoma'
        });


        this.input.keyboard.on('keydown', (e:KeyboardEvent)=>
        {
            if (e.keyCode == 32)
            {
                this.endturn();
            }
        });
    }


    update()
    {
        this.overlay.clear();
        this.fow.clear();
        for (let u of this.units)
        {
            u.setFrame(u.player);
            if (u.player == 0)
            {
                this.fow.fillCircleShape(u.ambient);
                this.fow.fillTriangleShape(u.fov);
            }
        }

        let m = this.fow.createGeometryMask();
        this.blackness.setMask(m);
        this.blackness.mask.invertAlpha = true;

        

        if (this.selectedUnit != null)
        {
            let u = this.selectedUnit;
            this.overlay.lineStyle(1, 0xFFFFFF);
            this.overlay.strokeCircle(this.selectedUnit.x, this.selectedUnit.y, 16);

            if (u.order != null)
            {
                
                if (this.input.activePointer.buttons == 2)
                {
                    let v = new Vector2(u.order.moveTo);
                    let p = new Vector2(this.input.activePointer.worldX, this.input.activePointer.worldY);
                    p.subtract(v);
                    let a = p.angle();
                    u.order.facing = a;
                    u.order.distance = p.length();
                    
                }
                {
                    this.overlay.lineBetween(u.x, u.y, u.order.moveTo.x, u.order.moveTo.y);
                    let v = new Vector2(Math.cos(u.order.facing), Math.sin(u.order.facing));
                    v.scale(u.order.distance);
                    v.add(new Vector2(u.order.moveTo.x, u.order.moveTo.y));

                    this.overlay.lineStyle(1, 0xFF0000);

                    let tri = u.calculateFov(new Vector2(u.order.moveTo), u.order.facing, u.order.distance);
                    this.overlay.strokeTriangleShape(tri);

                    //this.overlay.lineBetween(u.order.moveTo.x, u.order.moveTo.y, v.x, v.y);
                }
            }

            //let mp = new Phaser.Math.Vector2(this.input.activePointer.worldX, this.input.activePointer.worldY);
            //this.selectedUnit.lookAt(mp);

        }

                /*   let state = this.state;
        let tilemap = this.tilemap;


        let pointer = this.input.activePointer;

        tilemap.setLayer("overlay");
        tilemap.removeTileAtWorldXY(this.last.x, this.last.y);
        tilemap.putTileAtWorldXY(2, pointer.worldX, pointer.worldY);
        this.last.x = pointer.worldX;
        this.last.y = pointer.worldY;

        tilemap.setLayer("unit");
        for (let id in state.units)
        {
            let u = state.units[id];
            tilemap.removeTileAt(u.x, u.y);
        }


        for (let id in state.units)
        {
            let u = state.units[id];
            tilemap.putTileAt(0, u.x, u.y);
        }*/
    }
}

export class AttGame extends Phaser.Game
{
    constructor()
    {
        super({
            type: Phaser.AUTO,
            width: 640,
            height: 640,
            backgroundColor: 'black',
            parent: 'AttGame',
            scene: [AttScene]
        });

    }
}

new AttGame();
/*


let game = new Phaser.Game(config);

function preload ()
{
    load.spritesheet('diamonds', require('../assets/spritesheet.png'), { frameWidth: 32, frameHeight: 24 });
}

function create ()
{
    var group = this.add.group({
        key: 'diamonds',
        frame: [ 0, 1, 2, 3, 4 ],
        frameQuantity: 20
    });

    Phaser.Actions.GridAlign(group.getChildren(), {
        width: 10,
        height: 10,
        cellWidth: 32,
        cellHeight: 32,
        x: 100,
        y: 100
    });
}*/
