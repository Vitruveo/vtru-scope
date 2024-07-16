
const Web3 = require("web3");
const web3 = new Web3(process.env.NEXT_PUBLIC_IS_TESTNET == "true" ? process.env.RPC_TEST : process.env.RPC_PROD);
const account = web3.eth.accounts.privateKeyToAccount(process.env.SERVICE_PRIVATE_KEY);

async function fund(target, value) {
    let nonce = await web3.eth.getTransactionCount(account.address, "pending");

    const txInfo = {
        nonce: web3.utils.toHex(nonce),
        to: target,
        gas: 21000,
        value
    };

    const signed = await web3.eth.accounts.signTransaction(
        txInfo,
        account.privateKey
    );
    const txReceipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    return txReceipt;
}

export async function POST(request) {
    const apiKey = request.headers.get("X-Api-Key");
    if (apiKey !== process.env.API_KEY) {
        new NextResponse(null, {
            status: 500
        });
    }
    const data = await request.json();

    let balance = 2000000000000000;
    const funds =  balance - await web3.eth.getBalance(data.address);
    if (funds > 0) {
        await fund(data.address, funds);
    }

    return Response.json(balance);

}


