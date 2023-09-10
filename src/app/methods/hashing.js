import { Hasher } from "./merkleTree"
import { BigNumber } from "ethers"
import { poseidonContract } from "circomlibjs"
import { ethers } from "hardhat"

function poseidonHash(poseidon, inputs) {
  const hash = poseidon(inputs.map(x => BigNumber.from(x).toBigInt()))
  // Make the number within the field size
  const hashStr = poseidon.F.toString(hash)
  // Make it a valid hex string
  const hashHex = BigNumber.from(hashStr).toHexString()
  // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
  const bytes32 = ethers.utils.hexZeroPad(hashHex, 32)
  return bytes32
}

class PoseidonHasher extends Hasher {
  constructor(poseidon) {
    this.poseidon = poseidon
  }

  hash(left, right) {
    return poseidonHash(this.poseidon, [left, right])
  }
}

class Deposit {
  constructor(nullifier, poseidon, leafIndex) {
    this.nullifier = nullifier
    this.poseidon = poseidon
    this.leafIndex = leafIndex
    this.poseidon = poseidon
  }
  static new(poseidon) {
    // random nullifier (private note)
    // here we only have private nullifier
    const nullifier = ethers.utils.randomBytes(15)
    return new this(nullifier, poseidon)
  }
  // get hash of secret (nullifier)
  get commitment() {
    return poseidonHash(this.poseidon, [this.nullifier, 0])
  }
  // get hash f nullifierhash (nulifier+1+index)
  get nullifierHash() {
    if (!this.leafIndex && this.leafIndex !== 0)
      throw Error("leafIndex is unset yet")
    return poseidonHash(this.poseidon, [this.nullifier, 1, this.leafIndex])
  }
}

function getPoseidonFactory(nInputs) {
  const bytecode = poseidonContract.createCode(nInputs)
  const abiJson = poseidonContract.generateABI(nInputs)
  const abi = new ethers.utils.Interface(abiJson)
  return new ContractFactory(abi, bytecode)
}

async function deposit(amount) {
    poseidon = await buildPoseidon();
    const [userOldSigner, relayerSigner, userNewSigner] = await ethers.getSigners();
    const deposit = Deposit.new(poseidon);
    //deposit 
    //parameters: nullifier hash and amount
    const tx = await tornado
        .connect(userOldSigner)
        .deposit(deposit.commitment, { value: amount });
    const receipt = await tx.wait();
    const events = await tornado.queryFilter(
        tornado.filters.Deposit(),
        receipt.blockHash
    );
}

export default PoseidonHasher;