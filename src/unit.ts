import * as Phaser from 'phaser';
import Vector2 = Phaser.Math.Vector2;
import {TILESIZE} from './constants';

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
    horizon:Phaser.Geom.Line = new Phaser.Geom.Line();
    
    moveRadius = 4 * 16;
    shootRadius = 10 * 16;

    order:Order;
    focusDistance:number = 0;

    tileX:number = 0;
    tileY:number = 0;


    moveToTile(x:number, y:number, rotation:number, focusDistance:number)
    {
        x = Math.floor(x);
        y = Math.floor(y);
        this.tileX = x;
        this.tileY = y;
        this.x = this.tileX * TILESIZE + TILESIZE/2;
        this.y = this.tileY * TILESIZE + TILESIZE/2;
        this.focusDistance = focusDistance;
        this.rotation = rotation;
        this.ambient.setTo(this.x, this.y, 16)
        this.fov = this.calculateFov(new Vector2(this.x, this.y), this.rotation, this.focusDistance);
        this.horizon.setTo(this.fov.x2, this.fov.y2, this.fov.x3, this.fov.y3);
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