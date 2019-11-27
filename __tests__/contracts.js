/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

// @flow

import { TONAddressStringVariant } from '../src/modules/TONContractsModule';
import { TONOutputEncoding } from "../src/modules/TONCryptoModule";
import { WalletContractPackage } from './contracts/WalletContract';
import { tests } from "./_/init-tests";
import { SubscriptionContractPackage } from "./contracts/SubscriptionContract";

import type {
    TONContractLoadResult,
    TONContractPackage
} from "../types";


beforeAll(tests.init);
afterAll(tests.done);

const walletKeys = {
    public: 'fb98b2541ba805648f25eb469dd4766fcdde03a2cfe6fb41d8c1571c29407ca3',
    secret: '7bfe77bbd3ad57ada9ed323da83504723e3af7cd3ba68b02d3c8335f75e0a24e',
};

const walletAddress = '0:adb63a228837e478c7edf5fe3f0b5d12183e1f22246b67712b99ec538d6c5357';

test('load', async () => {
    const { contracts } = tests.client;
    const contract = await contracts.load({
        address: '0:0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
        includeImage: false,
    });
    expect(contract.id).toBeNull();
    expect(contract.balanceGrams).toBeNull();

    await tests.get_grams_from_giver(walletAddress);

    const w: TONContractLoadResult = await contracts.load({
        address: walletAddress,
        includeImage: false,
    });
    expect(w.id).toEqual(walletAddress);
    expect(Number.parseInt(w.balanceGrams || '')).toBeGreaterThan(0);
});

test('deploy_new', async () => {
    const { crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    await tests.deploy_with_giver({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });
});

test('Run aborted transaction', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const address =  await tests.deploy_with_giver({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });

    try {
        await contracts.run({
            address: address.address,
            abi: WalletContractPackage.abi,
            functionName: "sendTransaction",
            input: {
                dest: "0:0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
                value: 0,
                bounce: false
            },
            keyPair: keys
        });
    } catch (error) {
        expect(error.source).toEqual('node');
        expect(error.code).toEqual(102);
        expect(error.message).toEqual('VM terminated with exception (102) at computeVm');
        expect(error.data.phase).toEqual('computeVm');
        expect(error.data.transaction_id).toBeTruthy();
    }

    try {
        await contracts.run({
            address: address.address,
            abi: WalletContractPackage.abi,
            functionName: "sendTransaction",
            input: {},
            keyPair: keys
        });
    } catch (error) {
        //console.log(error);
        expect(error.source).toEqual('client');
        expect(error.code).toEqual(3012);
        expect(error.data).toBeNull();
    }
});

test('decodeInputMessageBody', async () => {
    const { contracts } = tests.client;
    const body = 'te6ccgEBAgEA3wAB8y88h10AAAFuW6FWJBERERERERERERERERERERERERERERERERERERERERERIXxlwlrjEGJEDhx3dC3WlQeZKzuAYBDOJ8+g7AM+Ek6AF49G0+VDwIkQKBdIh7hi4J5F0T/g5OggwrHI4HGN1KHAAAAAAAAAD2AAADkQAQDADBiSeQ1t5j0LwYo9dx7wefpnCQ3KrYOeAhX9ZUux62yIxWdQdUHJGCXXcoLbrDDduL9sgKSZT3TzYpRKi8YqASF8ZcJa4xBiRA4cd3Qt1pUHmSs7gGAQzifPoOwDPhJO';

    const result = await contracts.decodeInputMessageBody({
        abi: SubscriptionContractPackage.abi,
        bodyBase64: body
    });

    expect(result.function).toEqual('subscribe');
    expect(result.output).toEqual({
        period: '0x1c8',
        pubkey: '0x217c65c25ae31062440e1c77742dd69507992b3b806010ce27cfa0ec033e124e',
        subscriptionId: '0x1111111111111111111111111111111111111111111111111111111111111111',
        to: '0:bc7a369f2a1e04488140ba443dc31704f22e89ff07274106158e47038c6ea50e',
        value: '0x7b'
    });
});

const events_package: TONContractPackage = {
    abi: {
        "ABI version": 1,
        "functions": [
            {
                "name": "constructor",
                "inputs": [
                ],
                "outputs": [
                ]
            },
            {
                "name": "emitValue",
                "inputs": [
                    {"name":"id","type":"uint256"}
                ],
                "outputs": [
                ]
            },
            {
                "name": "returnValue",
                "inputs": [
                    {"name":"id","type":"uint256"}
                ],
                "outputs": [
                    {"name":"value0","type":"uint256"}
                ]
            }
        ],
        "events": [
            {
                "name": "EventThrown",
                "inputs": [
                    {"name":"id","type":"uint256"}
                ],
                "outputs": [
                ]
            }
        ],
        "data": [
        ]
    },
    imageBase64: "te6ccgECKQEABb0AAgE0BgEBAcACAgPPIAUDAQHeBAAD0CAAQdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAIo/wAgwAH0pCBYkvSg4YrtU1gw9KATBwEK9KQg9KEIAgPNQBAJAgFiCwoAB9GG2YQCASAPDAIBIA4NADs+ADIghBFty4OghB/////sM8LHyHPC//wFCAx2zCAANT4AMiCEEW3Lg6CEH////+wzwsfIc8L//AUMIAABuAIBahIRADXX9+ALmytzIvsrw6L7a5s5B8EvwUeAg4fYAYQAjdf36AsTq0tjIvsrw6L7a5s+Q554WAkOeLOGeFgJFnhZ+4Z4WPuGeFgBBnmpJnmLjQXks456AR54vKuOegkebxEGSCL4JtmEAgEgGhQB4P/+/QFtYWluX2V4dGVybmFsIY5Z/vwBZ2V0X3NyY19hZGRyINAg0wAycL2OGv79AWdldF9zcmNfYWRkcjBwyMnQVRFfAtsw4CBy1yExINMAMiH6QDP+/QFnZXRfc3JjX2FkZHIxISFVMV8E2zDYMSEVAfiOdf7+AWdldF9tc2dfcHVia2V5IMcCjhb+/wFnZXRfbXNnX3B1YmtleTFwMdsw4NUgxwGOF/7/AWdldF9tc2dfcHVia2V5MnAxMdsw4CCBAgDXIdcL/yL5ASIi+RDyqP7/AWdldF9tc2dfcHVia2V5MyADXwPbMNgixwKzFgHGlCLUMTPeJCIi/vkBc3RvcmVfc2lnbwAhb4wib4wjb4ztRyFvjO1E0PQFb4wg7Vf+/QFzdG9yZV9zaWdfZW5kXwUixwGOE/78AW1zZ19pc19lbXB0eV8G2zDgItMfNCPTPzUgFwF2joDYji/+/gFtYWluX2V4dGVybmFsMiQiVXFfCPFAAf7+AW1haW5fZXh0ZXJuYWwzXwjbMOCAfPLwXwgYAf7++wFyZXBsYXlfcHJvdHBwcO1E0CD0BDI0IIEAgNdFmiDTPzIzINM/MjKWgggbd0Ay4iIluSX4I4ED6KgkoLmwjinIJAH0ACXPCz8izws/Ic8WIMntVP78AXJlcGxheV9wcm90Mn8GXwbbMOD+/AFyZXBsYXlfcHJvdDNwBV8FGQAE2zACASAeGwIBSB0cAA+5j9xA5htmEAANuLblwdtmEAIBICAfAK+6Qlje3T/zDwI8iCECQlje2CEIAAAACxzwsfIc8L//AU/vwBcHVzaHBkYzd0b2M07UTQ9AHI7UdvEgH0ACHPFiDJ7VT+/QFwdXNocGRjN3RvYzQwXwLbMIAgEgJCEBCbiJACdQIgH+/v0BY29uc3RyX3Byb3RfMHBwgggbd0DtRNAg9AQyNCCBAIDXRY4UINI/MjMg0j8yMiBx10WUgHvy8N7eyCQB9AAjzws/Is8LP3HPQSHPFiDJ7VT+/QFjb25zdHJfcHJvdF8xXwX4ADDwIf78AXB1c2hwZGM3dG9jNO1E0PQByCMARO1HbxIB9AAhzxYgye1U/v0BcHVzaHBkYzd0b2M0MF8C2zACAWImJQCAsulhfNP/MPAi/vwBcHVzaHBkYzd0b2M07UTQ9AHI7UdvEgH0ACHPFiDJ7VT+/QFwdXNocGRjN3RvYzQwXwLbMAEC2ScB/v79AW1haW5faW50ZXJuYWwhjln+/AFnZXRfc3JjX2FkZHIg0CDTADJwvY4a/v0BZ2V0X3NyY19hZGRyMHDIydBVEV8C2zDgIHLXITEg0wAyIfpAM/79AWdldF9zcmNfYWRkcjEhIVUxXwTbMNgkIXD++QFzdG9yZV9zaWdvACEoAPxvjCJvjCNvjO1HIW+M7UTQ9AVvjCDtV/79AXN0b3JlX3NpZ19lbmRfBSLHAI4cIXC6jhIighBcfuIHVVFfBvFAAV8G2zDgXwbbMOD+/gFtYWluX2ludGVybmFsMSLTHzQicbqeIIAkVWFfB/FAAV8H2zDgIyFVYV8H8UABXwc="
};

test('filterOutput', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const deployed = await tests.deploy_with_giver({
        package: events_package,
        constructorParams: {},
        keyPair: keys,
    });

    await contracts.run({
        address: deployed.address,
        functionName: 'emitValue',
        abi: events_package.abi,
        input: { id: "0" },
        keyPair: keys,
    });

    const resultReturn = await contracts.run({
        address: deployed.address,
        functionName: 'returnValue',
        abi: events_package.abi,
        input: { id: "0" },
        keyPair: keys,
    });
    expect(JSON.stringify(resultReturn.output)).toEqual(`{"value0":"0x0"}`);
});

test('External Signing', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const contract_package = events_package;
    contract_package.abi["setTime"] = false;

    const deployParams = {
        package: contract_package,
        constructorParams: {},
        keyPair: keys,
    };
    const unsignedMessage = await contracts.createUnsignedDeployMessage(deployParams);
    const signKey = await crypto.naclSignKeypairFromSecretKey(keys.secret);
    const signBytesBase64 = await crypto.naclSignDetached({
        base64: unsignedMessage.signParams.bytesToSignBase64,
    }, signKey.secret, TONOutputEncoding.Base64);
    const signed = await contracts.createSignedDeployMessage({
        address: unsignedMessage.address,
        createSignedParams: {
            publicKeyHex: keys.public,
            signBytesBase64: signBytesBase64,
            unsignedBytesBase64: unsignedMessage.signParams.unsignedBytesBase64,
        }
    });

    const message = await contracts.createDeployMessage(deployParams);
    expect(signed.message.messageBodyBase64).toEqual(message.message.messageBodyBase64);
});

test('changeInitState', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const subscriptionAddress1 = '0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const subscriptionAddress2 = '0:fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

    const deployed1 = await tests.deploy_with_giver({
        package: WalletContractPackage,
        constructorParams: {},
        initParams: {
            subscription: subscriptionAddress1,
            owner: "0x" + keys.public
        },
        keyPair: keys,
    });

    const deployed2 = await tests.deploy_with_giver({
        package: WalletContractPackage,
        constructorParams: {},
        initParams: {
            subscription: subscriptionAddress2,
            owner: "0x" + keys.public
        },
        keyPair: keys,
    });

    expect(deployed1.address).not.toEqual(deployed2.address);

    const result1 = await contracts.runLocal({
        address: deployed1.address,
        functionName: 'getSubscriptionAccount',
        abi: WalletContractPackage.abi,
        input: { },
        keyPair: keys,
    });

    const result2 = await contracts.runLocal({
        address: deployed2.address,
        functionName: 'getSubscriptionAccount',
        abi: WalletContractPackage.abi,
        input: { },
        keyPair: keys,
    });

    expect(result1.output).toEqual({ value0: subscriptionAddress1 });
    expect(result2.output).toEqual({ value0: subscriptionAddress2 });
});

const setCode1_package: TONContractPackage = {
    abi: {
        "ABI version": 1,
        "functions": [
            {
                "name": "main",
                "inputs": [
                    {"name":"newcode","type":"cell"}
                ],
                "outputs": [
                    {"name":"value0","type":"uint256"}
                ]
            },
            {
                "name": "getVersion",
                "inputs": [
                ],
                "outputs": [
                    {"name":"value0","type":"uint256"}
                ]
            },
            {
                "name": "constructor",
                "inputs": [
                ],
                "outputs": [
                ]
            }
        ],
        "events": [
        ],
        "data": [
        ]
    } ,
    imageBase64: "te6ccgECJQEABSUAAgE0BgEBAcACAgPPIAUDAQHeBAAD0CAAQdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAIo/wAgwAH0pCBYkvSg4YrtU1gw9KARBwEK9KQg9KEIAgPNQA4JAgFiCwoAB9GG2YQCAVgNDAALPgAcdswgABM+AAg+wRwMdswgAgFqEA8ANdf34AubK3Mi+yvDovtrmzkHwS/BR4CDh9gBhACN1/foCxOrS2Mi+yvDovtrmz5DnnhYCQ54s4Z4WAkWeFn7hnhY+4Z4WAEGeakmeYuNBeSzjnoBHni8q456CR5vEQZIIvgm2YQCASAYEgHg//79AW1haW5fZXh0ZXJuYWwhjln+/AFnZXRfc3JjX2FkZHIg0CDTADJwvY4a/v0BZ2V0X3NyY19hZGRyMHDIydBVEV8C2zDgIHLXITEg0wAyIfpAM/79AWdldF9zcmNfYWRkcjEhIVUxXwTbMNgxIRMB+I51/v4BZ2V0X21zZ19wdWJrZXkgxwKOFv7/AWdldF9tc2dfcHVia2V5MXAx2zDg1SDHAY4X/v8BZ2V0X21zZ19wdWJrZXkycDEx2zDgIIECANch1wv/IvkBIiL5EPKo/v8BZ2V0X21zZ19wdWJrZXkzIANfA9sw2CLHArMUAcaUItQxM94kIiL++QFzdG9yZV9zaWdvACFvjCJvjCNvjO1HIW+M7UTQ9AVvjCDtV/79AXN0b3JlX3NpZ19lbmRfBSLHAY4T/vwBbXNnX2lzX2VtcHR5XwbbMOAi0x80I9M/NSAVAXaOgNiOL/7+AW1haW5fZXh0ZXJuYWwyJCJVcV8I8UAB/v4BbWFpbl9leHRlcm5hbDNfCNsw4IB88vBfCBYB/v77AXJlcGxheV9wcm90cHBw7UTQIPQEMjQggQCA10WaINM/MjMg0z8yMpaCCBt3QDLiIiW5JfgjgQPoqCSgubCOKcgkAfQAJc8LPyLPCz8hzxYgye1U/vwBcmVwbGF5X3Byb3QyfwZfBtsw4P78AXJlcGxheV9wcm90M3AFXwUXAATbMAIBIB4ZAgEgGxoAQ7qOEp69Qw8CLIghBo4SnrghCAAAAAsc8LHyHPC//wFNswgCAVgdHAAPtx+4gcw2zCAAQbdr4C3MPAjyIIQVa+At4IQgAAAALHPCx8hzwv/8BTbMIAIBSCIfAQm4iQAnUCAB/v79AWNvbnN0cl9wcm90XzBwcIIIG3dA7UTQIPQEMjQggQCA10WOFCDSPzIzINI/MjIgcddFlIB78vDe3sgkAfQAI88LPyLPCz9xz0EhzxYgye1U/v0BY29uc3RyX3Byb3RfMV8F+AAw/vwBcHVzaHBkYzd0b2M07UTQ9AHI7UchADxvEgH0ACHPFiDJ7VT+/QFwdXNocGRjN3RvYzQwXwIBAtwjAf7+/QFtYWluX2ludGVybmFsIY5Z/vwBZ2V0X3NyY19hZGRyINAg0wAycL2OGv79AWdldF9zcmNfYWRkcjBwyMnQVRFfAtsw4CBy1yExINMAMiH6QDP+/QFnZXRfc3JjX2FkZHIxISFVMV8E2zDYJCFw/vkBc3RvcmVfc2lnbwAhJAD8b4wib4wjb4ztRyFvjO1E0PQFb4wg7Vf+/QFzdG9yZV9zaWdfZW5kXwUixwCOHCFwuo4SIoIQXH7iB1VRXwbxQAFfBtsw4F8G2zDg/v4BbWFpbl9pbnRlcm5hbDEi0x80InG6niCAJFVhXwfxQAFfB9sw4CMhVWFfB/FAAV8H"
};

const setCode2_imageBase64 = 'te6ccgECJQEABSUAAgE0BgEBAcACAgPPIAUDAQHeBAAD0CAAQdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAIo/wAgwAH0pCBYkvSg4YrtU1gw9KARBwEK9KQg9KEIAgPNQA4JAgFiCwoAB9GG2YQCAVgNDAALPgActswgABM+AAg+wRwMdswgAgFqEA8ANdf34AubK3Mi+yvDovtrmzkHwS/BR4CDh9gBhACN1/foCxOrS2Mi+yvDovtrmz5DnnhYCQ54s4Z4WAkWeFn7hnhY+4Z4WAEGeakmeYuNBeSzjnoBHni8q456CR5vEQZIIvgm2YQCASAYEgHg//79AW1haW5fZXh0ZXJuYWwhjln+/AFnZXRfc3JjX2FkZHIg0CDTADJwvY4a/v0BZ2V0X3NyY19hZGRyMHDIydBVEV8C2zDgIHLXITEg0wAyIfpAM/79AWdldF9zcmNfYWRkcjEhIVUxXwTbMNgxIRMB+I51/v4BZ2V0X21zZ19wdWJrZXkgxwKOFv7/AWdldF9tc2dfcHVia2V5MXAx2zDg1SDHAY4X/v8BZ2V0X21zZ19wdWJrZXkycDEx2zDgIIECANch1wv/IvkBIiL5EPKo/v8BZ2V0X21zZ19wdWJrZXkzIANfA9sw2CLHArMUAcaUItQxM94kIiL++QFzdG9yZV9zaWdvACFvjCJvjCNvjO1HIW+M7UTQ9AVvjCDtV/79AXN0b3JlX3NpZ19lbmRfBSLHAY4T/vwBbXNnX2lzX2VtcHR5XwbbMOAi0x80I9M/NSAVAXaOgNiOL/7+AW1haW5fZXh0ZXJuYWwyJCJVcV8I8UAB/v4BbWFpbl9leHRlcm5hbDNfCNsw4IB88vBfCBYB/v77AXJlcGxheV9wcm90cHBw7UTQIPQEMjQggQCA10WaINM/MjMg0z8yMpaCCBt3QDLiIiW5JfgjgQPoqCSgubCOKcgkAfQAJc8LPyLPCz8hzxYgye1U/vwBcmVwbGF5X3Byb3QyfwZfBtsw4P78AXJlcGxheV9wcm90M3AFXwUXAATbMAIBIB4ZAgEgGxoAQ7qOEp69Qw8CLIghBo4SnrghCAAAAAsc8LHyHPC//wFNswgCAVgdHAAPtx+4gcw2zCAAQbdr4C3MPAjyIIQVa+At4IQgAAAALHPCx8hzwv/8BTbMIAIBSCIfAQm4iQAnUCAB/v79AWNvbnN0cl9wcm90XzBwcIIIG3dA7UTQIPQEMjQggQCA10WOFCDSPzIzINI/MjIgcddFlIB78vDe3sgkAfQAI88LPyLPCz9xz0EhzxYgye1U/v0BY29uc3RyX3Byb3RfMV8F+AAw/vwBcHVzaHBkYzd0b2M07UTQ9AHI7UchADxvEgH0ACHPFiDJ7VT+/QFwdXNocGRjN3RvYzQwXwIBAtwjAf7+/QFtYWluX2ludGVybmFsIY5Z/vwBZ2V0X3NyY19hZGRyINAg0wAycL2OGv79AWdldF9zcmNfYWRkcjBwyMnQVRFfAtsw4CBy1yExINMAMiH6QDP+/QFnZXRfc3JjX2FkZHIxISFVMV8E2zDYJCFw/vkBc3RvcmVfc2lnbwAhJAD8b4wib4wjb4ztRyFvjO1E0PQFb4wg7Vf+/QFzdG9yZV9zaWdfZW5kXwUixwCOHCFwuo4SIoIQXH7iB1VRXwbxQAFfBtsw4F8G2zDg/v4BbWFpbl9pbnRlcm5hbDEi0x80InG6niCAJFVhXwfxQAFfB9sw4CMhVWFfB/FAAV8H';


test('testSetCode', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const deployed = await tests.deploy_with_giver({
        package: setCode1_package,
        constructorParams: {},
        keyPair: keys,
    });

    const version1 = await contracts.run({
        address: deployed.address,
        functionName: 'getVersion',
        abi: setCode1_package.abi,
        input: { },
        keyPair: keys,
    });

    const code = await contracts.getCodeFromImage({
        imageBase64: setCode2_imageBase64
    });

    await contracts.run({
        address: deployed.address,
        functionName: 'main',
        abi: setCode1_package.abi,
        input: { newcode: code.codeBase64 },
        keyPair: keys,
    });

    const version2 = await contracts.run({
        address: deployed.address,
        functionName: 'getVersion',
        abi: setCode1_package.abi,
        input: { },
        keyPair: keys,
    });

    expect(version1).not.toEqual(version2);
});

test('testRunBody', async () => {
    const { contracts } = tests.client;

    const walletAddress = '0:2222222222222222222222222222222222222222222222222222222222222222';

    const result = await contracts.createRunBody({
        abi: SubscriptionContractPackage.abi,
        function: "constructor",
        params: {wallet: walletAddress},
        keyPair: walletKeys,
    });

    const parseResult = await contracts.decodeInputMessageBody({
        abi: SubscriptionContractPackage.abi,
        bodyBase64: result.bodyBase64,
    });

    expect(parseResult.function).toEqual('constructor');
    expect(parseResult.output).toEqual({wallet: walletAddress});

    const resultInternal = await contracts.createRunBody({
        abi: SubscriptionContractPackage.abi,
        function: "constructor",
        params: {wallet: walletAddress},
        internal: true,
    });

    const parseResultInternal = await contracts.decodeInputMessageBody({
        abi: SubscriptionContractPackage.abi,
        bodyBase64: resultInternal.bodyBase64,
        internal: true,
    });

    expect(parseResultInternal.function).toEqual('constructor');
    expect(parseResultInternal.output).toEqual({wallet: walletAddress});
});

test('Address conversion', async () => {
    const { contracts } = tests.client;

    const accountId = "fcb91a3a3816d0f7b8c2c76108b8a9bc5a6b7a55bd79f8ab101c52db29232260";
    const hex = "-1:fcb91a3a3816d0f7b8c2c76108b8a9bc5a6b7a55bd79f8ab101c52db29232260";
    const hexWorkchain0 = "0:fcb91a3a3816d0f7b8c2c76108b8a9bc5a6b7a55bd79f8ab101c52db29232260";
    const base64 = "Uf/8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15+KsQHFLbKSMiYG+9";
    const base64_url = "kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny";

    let convertedAddress = await contracts.convertAddress({
        address: accountId,
        convertTo: TONAddressStringVariant.Hex
    });
    expect(convertedAddress.address).toEqual(hexWorkchain0);

    convertedAddress = await contracts.convertAddress({
        address: hex,
        convertTo: TONAddressStringVariant.AccountId
    });
    expect(convertedAddress.address).toEqual(accountId);

    convertedAddress = await contracts.convertAddress({
        address: hex,
        convertTo: TONAddressStringVariant.Base64,
        base64Params: {
            test: false,
            bounce: false,
            url: false
        }
    });
    expect(convertedAddress.address).toEqual(base64);

    convertedAddress = await contracts.convertAddress({
        address: base64,
        convertTo: TONAddressStringVariant.Base64,
        base64Params: {
            test: true,
            bounce: true,
            url: true
        }
    });
    expect(convertedAddress.address).toEqual(base64_url);

    convertedAddress = await contracts.convertAddress({
        address: base64_url,
        convertTo: TONAddressStringVariant.Hex
    });
    expect(convertedAddress.address).toEqual(hex);
});