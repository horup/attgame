import * as Phaser from 'phaser';
import { State } from './state';
declare var require;

export class Unit extends Phaser.GameObjects.Sprite
{
    player:number = 0;
}

export class AttScene extends Phaser.Scene
{
    state:State;
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
    selectedUnit:Phaser.GameObjects.Sprite;
    selectionBox:Phaser.GameObjects.Image;

    makeUnit(x:number, y:number, player = 0)
    {
        let u = new Unit(this, x, y, 'units', 0);
        u.player = player;
        this.children.add(u);
        u.setInteractive();
        this.units.push(u);

        return u;
    }

    selectUnit(u:Unit)
    {
        this.selectedUnit = u;
    }

    create()
    {
        this.game.canvas.oncontextmenu = (e)=>e.preventDefault();
        
        this.state = new State();
        let state = this.state;
        state.initDemo();

        this.tilemap = this.make.tilemap({tileHeight:16, tileWidth:16, width:256, height:256});
        this.tilemap.addTilesetImage('tiles');
        this.tilemap.addTilesetImage('units');
        this.tilemap.addTilesetImage('overlay');
        this.tilemap.createBlankDynamicLayer("ground", 'tiles').setInteractive().on('pointerdown', (e:PointerEvent)=>
        {
            console.log("test");
            if (e.button == 0)
                this.selectedUnit = null;
            else if (e.button == 2)
            {
                if (this.selectedUnit != null)
                {
                    this.selectedUnit.x = e.x;
                    this.selectedUnit.y = e.y;
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


        this.selectionBox = this.make.image({key:'overlay', x:16, y:16, frame:2});
    }


    update()
    {
        for (let u of this.units)
        {
            u.setFrame(u.player);
        }
        if (this.selectedUnit != null)
            this.selectionBox.setVisible(true).setPosition(this.selectedUnit.x, this.selectedUnit.y);
        else
            this.selectionBox.setVisible(false);
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
