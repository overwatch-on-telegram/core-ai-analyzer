import { aveta } from 'aveta';
import markdownEscape from 'markdown-escape';

export const WAITING_GENERATION_AUDIT_MESSAGE = 'Generating Audit Report...';

const isDeadAddress = (address) => address.startsWith("0x0000") || address.endsWith("dead");

export const escapeMarkdownV2 = (text) => {
    return text.replace(/[~>`>#+-={}.!]/g, '\\$&');
}

export const escapeMissingMarkdownV2Char = (text) => {
    return text.replace(/[()*_]/g, '\\$&');
}

export const triggerAudit = (token) => {
    return fetch(`https://api.luckblock.io/audit/${token}`, {
        method: 'POST'
    })
        .then((data) => data.json());
}

export const fetchAuditStatus = (token) => {
    return fetch(`https://api.luckblock.io/audit/${token}/status`)
        .then((data) => data.json());
}

export const fetchAuditData = (token) => {
    return fetch(`https://api.luckblock.io/audit/${token}/json`)
        .then((data) => data.json());
}

const fetchMarketData = (token) => {
    return fetch(`https://dapp.herokuapp.com/token-market-data?contract=${token}`)
        .then((data) => data.json());
}

const fetchTokenData = (token) => {
    return fetch(`https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${token}`)
        .then((data) => data.json())
        .then((data) => data?.result?.[token]);
}

export const fetchSecondTokenData = (token) => {
    return fetch(`https://dapp.herokuapp.com/token-audit?contract=${token}`)
        .then((data) => data.json())
}

const fetchTokenMarketingWallet = (token) => {
    return fetch(`https://dapp.herokuapp.com/marketing-wallet?contract=${token}`)
        .then((data) => data.json());
}

const fetchTransactionData = (token) => {
    return fetch(`https://dapp.herokuapp.com/transaction-data?contract=${token}`)
        .then((data) => data.json());
}

const escapeLink = (text) => {
    return text.replace(/\./g, '.\u200C');
}

export const formatTokenStatistics = (tokenStatistics, /* showAuditReport = false, auditReport = undefined, */ showLockStatus = false) => {

    const marketCap = aveta(tokenStatistics.tokenMarketData.circSupply * tokenStatistics.tokenMarketData.price_usd, {
        digits: 5
    });

    const usdPrice = aveta(tokenStatistics.tokenMarketData.price_usd, {
        digits: 5
    });

    const holderCount = aveta(tokenStatistics.tokenMarketData.holder_count, {
        digits: 2
    });

    const liquidity = aveta(tokenStatistics.tokenMarketData.liquidity_usd, {
        digits: 4
    });

    const lastDayVolume = aveta(tokenStatistics.tokenMarketData.volume_24h_usd, {
        digits: 5
    });
    
    const circSupply = aveta(tokenStatistics.tokenMarketData.circSupply, {
        digits: 5
    });

    let message = `\n__*$${escapeLink(tokenStatistics.tokenAuditData.token_name)} Token Stats*__\n
🛒 *Total Supply:* $10bn
🏦 *Circ. Supply:* $${circSupply}
💰 *Marketcap:* $${marketCap}
💸 *Price:* $${usdPrice}
📊 *Volume:* $${lastDayVolume}
🔐 *Liquidity:* $${liquidity}
👥 *Holders:* ${holderCount}
#️⃣ *Holder score:* ${tokenStatistics.tokenAuditData.holderScore || 'Unknown'}
📢 *Marketing Wallet:* ${tokenStatistics.marketingWalletData?.marketingAddress ? `https://etherscan.io/address/${tokenStatistics.marketingWalletData?.marketingAddress}` : 'Unknown'}
💵 *Liquidity*: ${liquidity} \\(${tokenStatistics.isLocked ? `[${Math.round(tokenStatistics.lockedPercentage * 100)}% locked](${tokenStatistics.secondTokenAuditData.lpLockLink})` : `${Math.round(tokenStatistics.lockedPercentage * 100)}% locked`}, ${tokenStatistics.isBurnt ? `[${Math.round(tokenStatistics.burntPercentage * 100)}% burnt](${tokenStatistics.secondTokenAuditData.burnLink})` : `${Math.round(tokenStatistics.burntPercentage * 100)}% burnt`}\\)
🔗 *Pair address*: ${tokenStatistics.pairAddress ? `[${tokenStatistics.pairAddress}](https://etherscan.io/address/${tokenStatistics.pairAddress})` : 'Unknown'}
`.trim();

    if (showLockStatus) {
        if (!tokenStatistics.isLocked && !tokenStatistics.isBurnt) {
            message += '\n\n\n🟥 Waiting for liquidity lock/burn.\n';
        } else {
            message += '\n\n\n🟩 Liquidity is locked/burnt.\n';
        }
    }

    message += `\n\n__*$${escapeLink(tokenStatistics.tokenAuditData.token_name)} Token Contract Security*__\n\n${
        tokenStatistics.goPlusContractSecurity.map((item) => item.formattedValue).join('\n')
            .replace('*{{renounced}}:*  ✅', `*Renounced:* ${(!tokenStatistics.tokenAuditData?.owner_address || isDeadAddress(tokenStatistics.tokenAuditData?.owner_address)) ? 'Yes ✅' : 'No ❌'}`)
    }`;


    message += `\n\n__*$${escapeLink(tokenStatistics.tokenAuditData.token_name)} Token Trading Security*__\n\n${tokenStatistics.goPlusTradingSecurity.map((item) => item.formattedValue).join('\n')}`;

    /*
    if (showAuditReport && !auditReport) {
        message += `\n\n__*$${escapeLink(tokenStatistics.tokenAuditData.token_name)} AI Audit*__\n\n${WAITING_GENERATION_AUDIT_MESSAGE}`;
    } else {
        message += `\n\n__*$${escapeLink(tokenStatistics.tokenAuditData.token_name)} AI Audit*__\n\n${auditReport.issues?.length > 0 ? auditReport.issues?.map((issue, i) => {
            return `*Issue #${i+1}*\n\n${escapeMissingMarkdownV2Char(issue.issueExplanation.length > 200 ? issue.issueExplanation.slice(0, 200) + '...' : issue.issueExplanation)}\n\n[View recommendation](${issue.issueCodeDiffUrl})`
        }).join('\n\n') + '\n\n\n📄 [Download PDF](https://api.luckblock.io/audit/${tokenStatistics?.contractAddress}/direct-pdf)' : 'No Code Issues Detected.'}`;
    }
    */

    const uniswapLink = `https://app.uniswap.org/#/swap?inputCurrency=${tokenStatistics.contractAddress}&outputCurrency=ETH`;
    const etherscanLink = `https://etherscan.io/token/${tokenStatistics.contractAddress}`;
    const chartLink = `https://www.dextools.io/app/en/ether/pair-explorer/${tokenStatistics.contractAddress}`;
    message += `\n\n[Uniswap](${uniswapLink}) \\| [Etherscan](${etherscanLink}) \\| [Chart](${chartLink})`;

    message += `\n\n_Disclaimer: Nothing posted in this channel is financial advice but rather technical reviews of erc20 token smart contracts\. Our tools are still in BETA mode and tokens may require an additional manual review at this time\._`;

    message += `\n\n_Powered by LuckBlock.io_`;

    return escapeMarkdownV2(message);

}

// sometimes, we already have the pair address (and it can't be fetched using the standard method used here)
export const fetchTokenStatistics = async (contractAddress, forcePairAddress = undefined) => {

    const tokenAuditData = await fetchTokenData(contractAddress).catch(() => null);
    if (!tokenAuditData || !tokenAuditData.token_name) {
        throw new Error('Invalid contract address');
    }

    const secondTokenAuditData = await fetchSecondTokenData(contractAddress, forcePairAddress);

    const tokenMarketData = await fetchMarketData(contractAddress).catch(() => null);
    const marketingWalletData = await fetchTokenMarketingWallet(contractAddress).catch(() => null);

    if (tokenMarketData.error) {
        throw new Error('Invalid contract address (market)');
    }

    let pairAddress = forcePairAddress;

    // try to get an updated pair address
    const transactionData = await fetchTransactionData(contractAddress).catch(() => null);
    if (transactionData.data?.txHistory?.dexTrades?.[0]) {
        const tokensInfos = getTokensInfos(transactionData.data?.txHistory.dexTrades[0]);
        pairAddress = tokensInfos?.secondary?.address;
    }

    const holders = tokenAuditData.lp_holders || [];
    const lockedHolders = holders.filter((h) => !isDeadAddress(h.address) && h.is_locked === 1);
    const burntHolders = holders.filter((h) => isDeadAddress(h.address));
    const lockedPercentage = lockedHolders.map((holder) => parseFloat(holder.percent)).reduce((a, b) => a + b, 0);
    const burntPercentage = burntHolders.map((holder) => parseFloat(holder.percent)).reduce((a, b) => a + b, 0);

    const formatData = (name, formattedValue, isPositive) => `*${name}:* ${formattedValue} ${isPositive ? '✅' : '❌'}`;

    const securityProperties = [
        {'prop': 'is_open_source', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Open Source'},
        {'prop': 'null', 'parse_value': (value) => true, 'is_positive': (value) => true, 'format_value': (value) => '', 'display_name': '{{renounced}}'},
        {'prop': 'is_proxy', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Proxy'},
        {'prop': 'is_mintable', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Mintable'},
        {'prop': 'can_take_back_ownership', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Take Back Ownership'},
        {'prop': 'owner_address', 'parse_value': (value) => value, 'is_positive': (value) => value, 'format_value': (value) => value || 'Unknown', 'display_name': 'Owner Address'},
        {'prop': 'owner_change_balance', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Owner Change Balance'},
        {'prop': 'hidden_owner', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Hidden Owner'},
        {'prop': 'selfdestruct', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Self-destruct'},
        {'prop': 'external_call', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'External Call'},
    ];

    const goPlusContractSecurity = securityProperties.map((item) => {
        const prop = tokenAuditData[item.prop];
        const value = item.parse_value(prop);
        const isPositive = item.is_positive(value);
        const formattedValue = item.format_value(value);
        return {
            name: item.display_name,
            value,
            isPositive,
            formattedValue: formatData(item.display_name, formattedValue, isPositive)
        }
    });

    const tradingSecurityProperties = [
        {'prop': 'buy_tax', 'parse_value': (value) => parseFloat(value), 'is_positive': (value) => value === 0, 'format_value': (value) => !isNaN(value) ? `${value*100}%` : 'Unknown', 'display_name': 'Buy Tax'},
        {'prop': 'sell_tax', 'parse_value': (value) => parseFloat(value), 'is_positive': (value) => value === 0, 'format_value': (value) => !isNaN(value) ? `${value*100}%` : 'Unknown', 'display_name': 'Sell Tax'},
        {'prop': 'cannot_buy', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Cannot be Bought'},
        {'prop': 'cannot_sell_all', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Cannot Sell All'},
        {'prop': 'slippage_modifiable', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Modifiable Tax'},
        {'prop': 'is_honeypot', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Honeypot'},
        {'prop': 'transfer_pausable', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Pausable Transfer'},
        {'prop': 'is_blacklisted', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Blacklist'},
        {'prop': 'is_whitelisted', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Whitelist'},
        {'prop': 'is_in_dex', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'In main Dex'},
        {'prop': 'is_anti_whale', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Anti Whale'},
        {'prop': 'anti_whale_modifiable', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Modifiable anti whale'},
        {'prop': 'trading_cooldown', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Trading Cooldown'},
        {'prop': 'personal_slippage_modifiable', 'parse_value': (value) => !!parseInt(value), 'is_positive': (value) => !value, 'format_value': (value) => value ? 'Yes' : 'No', 'display_name': 'Personal Slippage Modifiable'},
    ];

    const goPlusTradingSecurity = tradingSecurityProperties.map((item) => {
        const prop = tokenAuditData[item.prop];
        const value = item.parse_value(prop);
        const isPositive = item.is_positive(value);
        const formattedValue = item.format_value(value);
        return {
            name: item.display_name,
            value,
            isPositive,
            formattedValue: formatData(item.display_name, formattedValue, isPositive)
        }
    });

    /*
    const isPartiallyValidated = goPlusContractSecurity.every((item) => item.isPositive || (item.name === 'Owner Address' || item.name === 'Open Source'))
        && goPlusTradingSecurity.every((item) => item.isPositive || (item.name === 'Buy Tax' || item.name === 'Sell Tax' || item.name === 'In main Dex'))
        && goPlusTradingSecurity.filter((item) => item.name === 'Buy Tax' || item.name === 'Sell Tax').every((item) => item.value < 0.1);*/

    const isPartiallyValidated = goPlusContractSecurity.find((i) => i.name === 'Mintable').isPositive
            && goPlusTradingSecurity.find((i) => i.name === 'Honeypot').isPositive;

    const isLockedOrBurnt = holders.length > 0 && (secondTokenAuditData?.burnLink || secondTokenAuditData?.lpLockLink);

    const isValidated = isPartiallyValidated && isLockedOrBurnt && tokenMarketData.circSupply && tokenMarketData.price_usd;

    return {

        contractAddress,
        
        tokenAuditData,
        secondTokenAuditData,
        tokenMarketData,
        marketingWalletData,
        transactionData,

        pairAddress,
        
        lockedPercentage,
        burntPercentage,

        isLocked: lockedPercentage > 0.9 && secondTokenAuditData?.lpLockLink,
        isBurnt: burntPercentage > 0.9 && secondTokenAuditData?.burnLink,

        goPlusContractSecurity,
        goPlusTradingSecurity,
        
        isPartiallyValidated,
        isValidated,

    }

}

/*
export const waitForAuditEndOrError = (contractAddress, eventEmitter) => {

    let lastStatus = null;

    let interval = setInterval(() => {
        fetchAuditStatus(contractAddress)
            .then(async (data) => {
                console.log(data.status)
                if (data.status === 'ended') {
                    clearInterval(interval);
                    const auditData = await fetchAuditData(contractAddress);
                    eventEmitter.emit('end', JSON.parse(auditData.data));
                }
                else if (data.status === 'errored' || data.status === 'unknown') {
                    clearInterval(interval);
                    eventEmitter.emit('error', '❌ ' + data.error || 'Oops, something went wrong!');
                }
                else if (data.status !== lastStatus) {
                    eventEmitter.emit('status-update', data.status);
                    lastStatus = data.status;
                }
            })
            .catch((error) => {
                clearInterval(interval);
                eventEmitter.emit('error', '❌ ' + error || 'Oops, something went wrong!');
            });
    }, 1000);

}
*/

function getTokensInfos(transaction) {
    const primarySide = transaction.side.toLowerCase();
    const secondarySide = primarySide === "buy" ? "sell" : "buy";
    return {
        primary: {
            symbol: transaction[`${primarySide}Currency`].symbol.toLowerCase(),
            address: transaction[`${primarySide}Currency`].address
        },
        secondary: {
            symbol: transaction[`${secondarySide}Currency`].symbol.toLowerCase(),
            address: transaction[`${secondarySide}Currency`].address
        }
    }
}
