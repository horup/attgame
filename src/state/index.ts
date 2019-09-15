import { Player } from './player';
import { Unit } from './unit';
import newId from '../newId';

export class State
{
    turn:number = 0;
    players:{[id:string]:Player};
    units:{[id:string]:Unit};

    newUnit(player:string, x = 0, y = 0)
    {
        let unit = new Unit();
        unit.id = newId();
        unit.x = x;
        unit.y = y;
        this.units[unit.id] = unit;
        return unit;
    }

    newPlayer(name:string)
    {
        let player = new Player();
        player.id = newId();
        this.players[player.id] = player;
        return player;
    }



    initDemo()
    {
        this.players = {};
        this.units = {};
        this.turn = 0;

        {
            let player = this.newPlayer("Player 1");
            let u = this.newUnit(player.id, 16, 3);
        }
        {
            let player = this.newPlayer("Player 2");
            let u = this.newUnit(player.id, 16, 28);
        }



    }
}

export * from './player';
export * from './unit';