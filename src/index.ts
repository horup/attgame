import * as Phaser from 'phaser';
import Vector2 = Phaser.Math.Vector2;
import {Unit, Order} from './unit';
import {TILESIZE} from './constants';
import bresenham from 'bresenham';

declare var require;
/*
var line = bresenham(1, 2, 3, 4);
do {
 console.log(line);
  var point = line.next().value;
  console.log(point);
  // do something
} while(point);*/


export class AttScene extends Phaser.Scene
{
    currentPlayer = 0;
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
    
    overlay:Phaser.GameObjects.Graphics;

    makeUnit(x:number, y:number, player = 0)
    {
        let u = new Unit(this, x, y, 'units', 0);
        u.player = player;
        this.children.add(u);
        u.setInteractive();
        this.units.push(u);

        u.moveToTile(x, y, 0, 100);

        return u;
    }

    selectUnit(u:Unit)
    {
        this.selectedUnit = u;
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
                u.moveToTile(u.order.moveTo.x / TILESIZE, u.order.moveTo.y / TILESIZE, u.order.facing, u.order.distance);
                u.order = null;
            }
        }
    }


    grayness:Phaser.GameObjects.Rectangle;
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
                }
            }
        })

        this.tilemap.setLayer("ground");
        let size = 32;
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++)
                this.tilemap.putTileAt(11 + Phaser.Math.RND.integer() % 2, x, y);

        {
            let u = this.makeUnit(6, 6);
            u.on('pointerdown', (e:PointerEvent)=>e.button == 0 ? this.selectUnit(u) : undefined);
        }

        {
            let u = this.makeUnit(12, 32-6, 1);
            u.on('pointerdown', (e:PointerEvent)=>e.button == 0 ? this.selectUnit(u) : undefined);
        }

        this.grayness = this.add.rectangle(0, 0, 800, 800, 0);
        this.grayness.alpha = 0.0;
        this.grayness.setOrigin(0, 0);


        this.overlay = this.add.graphics({lineStyle:{width:1}});


        this.input.keyboard.on('keydown', (e:KeyboardEvent)=>
        {
            if (e.keyCode == 32)
            {
                this.endturn();
            }
            else if (e.key == "1")
                this.currentPlayer = 0;
            else if (e.key == "2")
                this.currentPlayer = 1;
        });

        this.tilemap.createBlankDynamicLayer("blackness", 'overlay');
        this.tilemap.createBlankDynamicLayer("fogofwar", 'overlay');
        this.tilemap.setLayer("fogofwar");
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++)
                this.tilemap.putTileAt(0, x, y);

        this.tilemap.setLayer("blackness");
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++)
                this.tilemap.putTileAt(0, x, y);

                
        this.currentTurn = this.add.text(8, 8, "Turn 1", 
        {
            fontSize:'32px',
            color:'red',
            align:'center',
            fontFamily: 'Tahoma'
        });

    }


    update()
    {
        this.overlay.clear();
        this.tilemap.setLayer("fogofwar");
        this.tilemap.forEachTile(t=>t.alpha = 0.5);
        for (let u of this.units)
        {
            u.setFrame(u.player);
            if (u.player == this.currentPlayer)
            {
              /*  this.fow.fillCircleShape(u.ambient);
                this.fow.fillTriangleShape(u.fov);*/
            }

            if (u.player == this.currentPlayer)
            {
                this.tilemap.setLayer("fogofwar");
                this.tilemap.getTilesWithinShape(u.ambient).forEach(t=>
                {
                    t.setAlpha(0.0);
                });
                this.tilemap.getTilesWithinShape(u.horizon).forEach(t=>
                {
                    let sx = u.tileX;
                    let sy = u.tileY;
                    let ex = t.x;
                    let ey = t.y;
                    let line = bresenham(sx, sy, ex, ey);
                    this.tilemap.setLayer("fogofwar");
                    for (let p of line)
                    {
                        let t = this.tilemap.getTileAt(p.x, p.y)
                        if (t != null)
                            t.setAlpha(0);
                    }
                    this.tilemap.setLayer("blackness");
                    for (let p of line)
                    {
                        let t = this.tilemap.getTileAt(p.x, p.y);
                        if (t != null)
                            t.setAlpha(0);
                    }
                   /* do {
                        var p = line.next().value;

                        if (p != undefined)
                        {
                            this.tilemap.getTileAt(p.x, p.y).setAlpha(0);
                        }
                    } while(p);*/
                });

                this.tilemap.setLayer("blackness");
                this.tilemap.getTilesWithinShape(u.ambient).forEach(t=>
                {
                    t.setAlpha(0.0);
                });
                this.tilemap.getTilesWithinShape(u.horizon).forEach(t=>
                {
                    t.setAlpha(0.0);
                });
            }

          
        }

        this.tilemap.setLayer("fogofwar");
        for (let u of this.units)
        {
            let t = this.tilemap.getTileAt(u.tileX, u.tileY);

            u.visible = t != null ? t.visible : true;
        }

        

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
