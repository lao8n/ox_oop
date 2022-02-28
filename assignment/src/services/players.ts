// data imports
import { DataFactory } from "../../data/uk";
// types imports
import { Money } from "../types/money";
import { NumPlayers, Player, PlayerID } from "../types/player";
import { BoardLocation } from "../types/board";

export class Players<M extends Money> {
    private _players : Map<PlayerID, Player<M>> = new Map<PlayerID, 
        Player<M>>();
    private _order : PlayerID[];
    private _orderIndex : number;

    constructor(readonly numPlayers: NumPlayers){
        this._order = new Array<PlayerID>(numPlayers);
        for(let i = 1; i <= numPlayers; i++){
            this._players.set(i as PlayerID, {
                id: i as PlayerID,
                wealth: DataFactory.createStartingMoney<M>(),
                location: {street: 1 , num: 1} as BoardLocation,
                inJail: false
            });
            // default order
            this._order[i - 1] = i as PlayerID;
        }
        this._orderIndex = 0;
    }

    getCurrentTurnPlayer(): PlayerID {
        const player = this._order[this._orderIndex];
        if(!player){
            throw new Error("Unable to find current turn player");
        }    
        return player;
    }

    getNextTurnPlayer(): PlayerID{
        this._orderIndex = (this._orderIndex + 1) % this.numPlayers;
        return this.getCurrentTurnPlayer();
    }

    getCurrentTurnNotPlayer(): PlayerID {
        const orderIndex =  (this._orderIndex + 1) % this.numPlayers;
        const player = this._order[orderIndex];
        if(!player){
            throw new Error("Unable to find current turn player");
        }
        return player;
    }

    getOrder(): PlayerID[]{
        return this._order;
    }

    setOrder(order : PlayerID[]){
        if(order.length != this.numPlayers){
            throw new Error(`Order has ${order.length} players not ` +
                            `${this.numPlayers} as required`);
        }
        const orderSet = new Set<PlayerID>();
        const newOrder : PlayerID[] = [];
        for(let i = 0; i < this.numPlayers; i++){
            const p = order[i];
            if(p){
                this.validatePlayerID(p);
                if(orderSet.has(p)){
                    throw new Error(`Repeated player ${p} in order`);
                }
                newOrder[i] = p;
                orderSet.add(p);
            }
        }
        // only override order if it's valid
        this._order = newOrder;
        this._orderIndex = 0;
    }

    getLocation(id: PlayerID){
        this.validatePlayerID(id);
        const player = this._players.get(id);
        if(player && player?.location){
            return player.location;
        }
        throw new Error(`Player ${id} has null location`);
    }

    setLocation(id: PlayerID, location: BoardLocation){
        this.validatePlayerID(id);
        // typescript doesn't keep type information about values at specific
        // array indices
        const currentPlayer = this._players.get(id);
        if(currentPlayer){
            currentPlayer.location = location;
            this._players.set(id, currentPlayer);
            return true;
        }        
        return false;
    }

    getInJail(id: PlayerID){
        this.validatePlayerID(id);
        const player = this._players.get(id);
        if(player){
            return player.inJail;
        }
        throw new Error(`Player ${id} doesn't exist`);
    }

    setInJail(id: PlayerID, inJail: boolean){
        this.validatePlayerID(id);
        // we check that its defined before asserting it is
        const currentPlayer = this._players.get(id);
        if(currentPlayer){
            currentPlayer.inJail = inJail;
            this._players.set(id, currentPlayer);
            return true;
        } 
        return false;
    }

    getWealth(id: PlayerID){
        this.validatePlayerID(id);
        const currentPlayer = this._players.get(id);
        if(currentPlayer){
            return currentPlayer.wealth;
        }
        return null;
    }
    
    addMoney(id: PlayerID, amount: M){
        this.validatePlayerID(id);
        this.validateAmount(amount);
        const currentPlayer = this._players.get(id);
        if(currentPlayer){
            currentPlayer.wealth = currentPlayer.wealth + amount as M;
            this._players.set(id, currentPlayer);
            return true;
        } 
        return false;
    }

    removeMoney(id: PlayerID, amount: M){
        this.validatePlayerID(id);
        this.validateAmount(amount);
        const currentPlayer = this._players.get(id);
        if(currentPlayer){
            const r = BigInt(currentPlayer.wealth - amount);
            if(r < 0){
                return false;
            } 
            currentPlayer.wealth = r as M;
            this._players.set(id, currentPlayer);
            return true;
        }
        return false;
    }

    private validatePlayerID(id: PlayerID){
        if(id > this.numPlayers){
            throw new Error(`Id ${id} is invalid as only ${this.numPlayers} ` +
                            `players`);
        }
    }

    private validateAmount(amount: M){
        if(amount <= 0){
            throw new Error(`Expected positive amount of money not ${amount}`);
        }
    }
}