import { MerkleTree, Hasher } from "./merkleTree";
import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";

function poseidonHash(poseidon, inputs) {
    const hash = poseidon(inputs.map(x => BigNumber.from(x).toBigInt()));
    // Make the number within the field size
    const hashStr = poseidon.F.toString(hash);
    // Make it a valid hex string
    const hashHex = BigNumber.from(hashStr).toHexString();
    // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
    const bytes32 = ethers.utils.hexZeroPad(hashHex, 32);
    return bytes32;
}

class PoseidonHasher extends Hasher {
    constructor(poseidon) {
        this.poseidon = poseidon;
    }

    hash(left, right) {
        return poseidonHash(this.poseidon, [left, right]);
    }
}

export default PoseidonHasher