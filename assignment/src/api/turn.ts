import { DataFactory } from "../../data/uk"
import { Board } from "../services/board"
import { diceGenerator, PairDiceValue } from "../services/dice"
import { Ownership } from "../services/ownership"
import { Players } from "../services/players"
import { BoardLocation, GenericBoard, MonopolyBoard, Space } from "../types/board"
import { Money } from "../types/money"
import { PlayerID } from "../types/player"
import { Transfer } from "../services/transfer"

export type Turn = TurnRoll | TurnUnownedProperty | TurnOwnedProperty 

export interface TurnBase {
    readonly player: PlayerID
    readonly stage: Stage
}

export interface TurnRoll extends TurnBase {
    readonly stage: "Roll"
    roll(player : PlayerID): TurnUnownedProperty | TurnOwnedProperty | 
        TurnFinish | TurnRoll
    getDiceRoll(): PairDiceValue | undefined
}
export interface TurnInJail extends TurnBase {
    readonly stage: "Jail"
    rollJail(player: PlayerID): TurnUnownedProperty | TurnOwnedProperty | 
        TurnInJail | TurnFinish
    getDiceRoll(): PairDiceValue | undefined
}
export interface TurnUnownedProperty extends TurnBase {
    readonly stage: "UnownedProperty"
    buyProperty(player : PlayerID): TurnFinish | TurnUnownedProperty
    finishTurn(player : PlayerID): TurnRoll | TurnUnownedProperty
}
export interface TurnOwnedProperty extends TurnBase{
    readonly stage: "OwnedProperty"
    payRent(player : PlayerID): TurnFinish | TurnOwnedProperty
    finishTurn(player : PlayerID): TurnRoll | TurnOwnedProperty
}
export interface TurnFinish extends TurnBase {
    readonly stage: "Finish"
    finishTurn(player : PlayerID): TurnRoll | TurnInJail | TurnFinish
}

export type Stage = "Roll" | "Jail" | "UnownedProperty" | "OwnedProperty" | 
    "Finish"

export class ConcreteTurn<M extends Money, B extends GenericBoard<M>>{
    // these fields are not exposed through the interfaces so do not need to be
    // private
    player : PlayerID = 1
    stage: Stage = "Roll" // tag property
    private space : Space<M>
    private dice = diceGenerator()
    private lastDiceRoll: PairDiceValue | undefined = undefined

    constructor(
        private readonly board: Board<M, B>,
        private readonly players : Players<M>,
        private readonly ownership: Ownership<M, B>,
        private readonly transfer: Transfer<M, B>,
    ){
        this.player = this.players.getCurrentTurnPlayer()
        this.stage = "Roll" // tag property
        this.space = DataFactory.createGo<M>()
    }

    start(): TurnRoll{
        return this as TurnRoll
    }

    roll(player : PlayerID): TurnUnownedProperty | TurnOwnedProperty | 
        TurnFinish | TurnRoll {
        if(player != this.player){
            return this as TurnRoll
        }
        let roll = this.dice.next()
        if(roll.done == false){
            if(roll.value){
                this.lastDiceRoll = roll.value[0]
                const location = this.updateLocation(roll.value[0])  
                // didn't throw a double           
                if(roll.value[1]){
                    return this.updateStage(location)
                // threw a double
                } else {
                    return this as TurnRoll
                }
            } else {
                throw new Error(`Unable to get dice roll value for ${roll}`)
            }
        // threw 3 doubles
        } else {
            const jail = this.board.getJailLocation()
            if(jail){
                this.players.setLocation(this.player, jail)
                this.players.setInJail(this.player, true)
            // if jail doesn't exist go to first location on board
            } else {
                this.players.setLocation(this.player, {street: 1, num: 1})
            } 
            this.dice = diceGenerator()
            this.stage = "Finish"
            return this as TurnFinish
        }
    }

    rollJail(player: PlayerID): TurnUnownedProperty | TurnOwnedProperty | 
        TurnInJail | TurnFinish {
        if(player != this.player){
            return this as TurnInJail
        }
        let roll = this.dice.next()
        if(roll.done == false){
            if(roll.value){
                this.lastDiceRoll = roll.value[0]
                // didn't throw a double
                if(roll.value[1]){
                    this.stage = "Finish"
                    return this as TurnFinish
                // threw a double
                } else {
                    this.players.setInJail(this.player, false)
                    const location = this.updateLocation(roll.value[0])
                    return this.updateStage(location)
                }
            }
        }
        this.stage = "Finish"
        return this as TurnFinish
    }

    getDiceRoll(){
        return this.lastDiceRoll
    }

    buyProperty(player : PlayerID): TurnFinish | TurnUnownedProperty {
        if(player != this.player){
            return this as TurnUnownedProperty
        }
        // cannot make a separate method isProperty as typescript cannot do type 
        // inference
        if(this.space.kind == "Deed" || this.space.kind == "Utility" || 
           this.space.kind == "Train") {
            this.transfer.buyProperty(this.player, this.space)
        }
        this.stage = "Finish"
        return this as TurnFinish
    }

    payRent(player : PlayerID): TurnFinish | TurnOwnedProperty {
        if(player != this.player){
            return this as TurnOwnedProperty
        }
        if(this.space.kind == "Deed" || this.space.kind == "Train") {
            this.transfer.payRent(this.player, this.space)
        } else if (this.space.kind == "Utility"){
            if(this.lastDiceRoll){
                this.transfer.payUtilityRent(this.player, this.space, 
                    this.lastDiceRoll)
            }
        }
        this.stage = "Finish"
        return this as TurnFinish
    }

    finishTurn(player : PlayerID): TurnRoll | TurnInJail | TurnFinish {
        if(player != this.player){
            return this as TurnFinish
        }
        this.dice.next(true)
        this.player = this.players.getNextTurnPlayer()
        if(this.players.getInJail(this.player)){
            this.stage = "Jail"
            return this as TurnInJail
        }
        this.stage = "Roll"
        return this as TurnRoll
    }

    /**
     * This method not only updates the user's position but also adds 200
     * if the user passes Go
     * 
     * @param rollResult 
     * @returns 
     */
    private updateLocation(rollResult: PairDiceValue){
        let location = this.players.getLocation(this.player)
        if(location){
            let newLocation = this.board.movePiece(location, rollResult)
            if(newLocation.street < location.street){
                this.players.addMoney(this.player, 200n as M)
            }
            this.players.setLocation(this.player, newLocation)
            location = newLocation
        }
        return location
    }

    private updateStage(location: BoardLocation){
        this.space = this.board.getSpace(location)
        const owner = this.ownership.getOwner(this.space.name)
        // unowned
        if(owner == null){
            this.stage = "UnownedProperty"
            return this as TurnUnownedProperty
        } 
        // owned
        else if (owner){
            this.stage = "OwnedProperty"
            return this as TurnOwnedProperty
        }
        // undefined i.e. not an ownable property  
        else {
            this.stage = "Finish"
            return this as TurnFinish
        }
    }
}