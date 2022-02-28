import { Money } from '../types/money';
import { PlayerID } from '../types/player';
import * as board from '../types/board';
import { Owner } from '../types/ownership'

export class Ownership<M extends Money, B extends board.GenericBoard<M>>{
    private ownership: Map<string, Owner | null> = 
        new Map<string, Owner | null>();
    constructor(private readonly monopolyboard: B){
        this.initOwnership(this.monopolyboard);
    }

    /**
     * Assignment notes
     * - Optional chaining ?. to get nested access when reference might be 
     *   undefined
     * - Strict check === to differentiate between undefined which means not 
     *   yet defined for new spaces and null which means an absence of a value
     *   which is what we initialize to
     * - Partial discrimination to distinguish ownable spaces from non-ownable
     */
    private initOwnership(b: B){
        for(const bs of board.boardstreets){
            for(const bn of board.boardnumbers){
                // reached end of board
                const space = b?.[bs]?.[bn];
                if(!space){ 
                    return;
                }
                // safe as already checked that these are defined and kind and 
                // name must exist
                const kind = space.kind;
                const name = space.name;
                const isDeed = kind == "Deed";
                const isTrain = kind == "Train";
                const isUtility = kind == "Utility";
                const canBeOwned = isDeed || isTrain || isUtility;
                if(canBeOwned){
                    if(this.ownership.get(name) === null){
                        throw new Error(`Inputted board has non-unique space` + 
                            ` names where ${name} already exists`);
                    } else {
                        this.ownership.set(name, null);
                    }
                }
            }
        }
    }

    public getOwner(name : string): Owner | undefined | null {
        return this.ownership.get(name);
    }

    /**
     * 
     * @param player 
     * @param name 
     * @param setNames
     * 
     * Assignment notes
     * -  
     */
    public acquire(player: PlayerID, name: string, setNames : string[]){
        // validate
        if(!setNames.includes(name)){
            throw new Error(`Invalid setNames does not include ${name}`);
        }

        if(this.getOwner(name) === null){
            this.ownership.set(name, { id: player, sameOwner: false });
            const sameOwner = this.sameOwner(player, setNames);
            if(sameOwner){
                for(const sn of setNames){
                    this.ownership.set(sn, { id : player, sameOwner: true});
                }
            }
            return true;
        }
        // if name doesn't exist or is already owned
        return false;
    }

    public release(player: PlayerID, name: string, setNames : string[]){
        // validate
        if(!setNames.includes(name)){
            throw new Error(`Invalid setNames does not include ${name}`);
        }
        if(setNames.length < 2 || setNames.length > 4){
            throw new Error(`Inputted set is invalid, it has length ` + 
                            `${setNames.length} but it must have at least 2 ` +
                            `and at most 4 entries`);
        }

        if(this.getOwner(name)?.id == player){
            for(const sn of setNames){
                this.ownership.set(sn, {id : player, sameOwner: false});
            }
            this.ownership.set(name, null);
            return true;
        }
        // if property doesn't exist, not owned, or owned by another player
        return false;
    }

    /**
     * 
     * @param player 
     * @param setNames 
     * @returns 
     * 
     * Assignment notes
     * - use functional methods map and reduce to replicate fold logic
     */
    private sameOwner(player: PlayerID, setNames : string[]){
        // validate
        if(setNames.length < 2 || setNames.length > 4){
            throw new Error(`Inputted set is invalid, it has length ` + 
                            `${setNames.length} but it must have at least 2 ` +
                            `and at most 4 entries`);
        }
        return setNames.map(name => this.ownership.get(name)?.id == player)
                       .reduce((acc, cv) => acc && cv, true);
    }
}