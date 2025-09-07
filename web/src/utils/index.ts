import { clsx, type ClassValue } from 'clsx';
import { MarketType, type MarketInfo } from '@/types';
import React from 'react';

/**
 * 股票和指数的中文名称映射
 */
const STOCK_INDEX_NAMES: Record<string, string> = {
  // A股主要指数
  '000001': '上证综指',
  '000002': '深证成指',
  '000003': '深证成指R',
  '000004': '深证100R',
  '000005': '深证综指',
  '000006': '深证A指',
  '000007': '深证B指',
  '000008': '中小板指',
  '000009': '上证380',
  '000010': '上证180',
  '000011': '基金指数',
  '000012': '国债指数',
  '000013': '企债指数',
  '000016': '上证50',
  '000017': '新综指',
  '000018': '180金融',
  '000019': '180内需',
  '000020': '180治理',
  '000021': '180成长',
  '000022': '180价值',
  '000023': '180动态',
  '000024': '180资源',
  '000025': '180运输',
  '000026': '180金属',
  '000027': '180能源',
  '000028': '180基建',
  '000029': '180科技',
  '000030': '上证经济200',
  '000031': '上证小盘',
  '000032': '上证中盘',
  '000033': '上证大盘',
  '000034': '上证高新',
  '000035': '上证国企',
  '000036': '上证资源',
  '000037': '上证材料',
  '000038': '上证工业',
  '000039': '上证可选',
  '000040': '上证消费',
  '000041': '上证医药',
  '000042': '上证金融',
  '000043': '上证信息',
  '000044': '上证电信',
  '000045': '上证公用',
  '000046': '上证不动产',
  '000047': '上证全指',
  '000048': '上证责任',
  '000049': '上证50等权',
  '000050': '上证50',
  '000051': '上证中国120',
  '000052': '上证社会责任',
  '000053': '上证中小',
  '000054': '上证民企',
  '000055': '上证民营',
  '000056': '上证中型',
  '000057': '上证小型',
  '000058': '上证红利',
  '000059': '上证超大',
  '000060': '上证治理',
  '000061': '上证公司治理',
  '000062': '上证龙头企业',
  '000063': '上证周期',
  '000064': '上证成长',
  '000065': '上证价值',
  '000066': '上证大宗商品',
  '000067': '上证180等权',
  '000068': '上证公用事业',
  '000069': '上证龙头',
  '000070': '上证消费80',
  '000071': '上证380等权',
  '000072': '上证380成长',
  '000073': '上证380价值',
  '000074': '上证380动态',
  '000075': '上证380治理',
  '000076': '上证能源',
  '000077': '上证原材料',
  '000078': '上证工业',
  '000079': '上证可选消费',
  '000080': '上证主要消费',
  '000081': '上证医药卫生',
  '000082': '上证金融地产',
  '000083': '上证信息技术',
  '000084': '上证电信服务',
  '000085': '上证公用事业',
  '000086': '上证龙头企业',
  '000087': '上证社会责任',
  '000088': '上证高股息',
  '000089': '上证民营企业',
  '000090': '上证中小',
  '000091': '上证流通',
  '000092': '上证中型',
  '000093': '上证小型',
  '000094': '上证治理',
  '000095': '上证180成长',
  '000096': '上证180价值',
  '000097': '上证180动态',
  '000098': '上证治理',
  '000099': '上证380',
  '000300': '沪深300',
  '000301': '沪深300净收益',
  '000302': '沪深300全收益',
  '000303': '沪深300价值',
  '000304': '沪深300成长',
  '000305': '基金指数',
  '000306': '深证ETF',
  '000307': '深证300价值',
  '000308': '深证300成长',
  '000309': '深证300',
  '000310': '深证300R',
  '000311': '深证1000',
  '000312': '深证1000R',
  '000313': '深证龙头',
  '000314': '深证龙头R',
  '000315': '深证创新',
  '000316': '深证创新R',
  '000317': '深证基本面60',
  '000318': '深证基本面60R',
  '000319': '深证基本面120',
  '000320': '深证基本面120R',
  '000321': '深证基本面200',
  '000322': '深证基本面200R',
  '000323': '深证基本面',
  '000324': '深证基本面R',
  '000325': '深证红利',
  '000326': '深证红利R',
  '000327': '深证治理',
  '000328': '深证治理R',
  '000329': '深证责任',
  '000330': '深证责任R',
  '000331': '深证大宗商品',
  '000332': '深证大宗商品R',
  '000333': '中小板R',
  '000334': '深证民营',
  '000335': '深证民营R',
  '000336': '深证创业板',
  '000337': '深证创业板R',
  '000338': '深证责任等权',
  '000339': '深证责任等权R',
  '000340': '深证100等权',
  '000341': '深证100等权R',
  '000342': '深证300等权',
  '000343': '深证300等权R',
  '000344': '深证300价值等权',
  '000345': '深证300价值等权R',
  '000346': '深证300成长等权',
  '000347': '深证300成长等权R',
  '000348': '深证责任',
  '000349': '深证责任R',
  '000350': '深证300能源',
  '000351': '深证300能源R',
  '000352': '深证300材料',
  '000353': '深证300材料R',
  '000354': '深证300工业',
  '000355': '深证300工业R',
  '000356': '深证300可选',
  '000357': '深证300可选R',
  '000358': '深证300消费',
  '000359': '深证300消费R',
  '000360': '深证300医药',
  '000361': '深证300医药R',
  '000362': '深证300金融',
  '000363': '深证300金融R',
  '000364': '深证300信息',
  '000365': '深证300信息R',
  '000366': '深证300电信',
  '000367': '深证300电信R',
  '000368': '深证300公用',
  '000369': '深证300公用R',
  '399001': '深证成指',
  '399002': '深成指R',
  '399003': '成份B指',
  '399004': '深证100R',
  '399005': '中小板指',
  '399006': '创业板指',
  '399007': '深证300',
  '399008': '中小300',
  '399009': '深证200',
  '399010': '深证700',
  '399011': '深证1000',
  '399012': '创业300',
  '399013': '深证精选',
  '399100': '新指数',
  '399101': '中小板综',
  '399102': '创业板综',
  '399103': '乐富指数',
  '399104': '深证行业',
  '399105': '深证细分',
  '399106': '深证综指',
  '399107': '深证A指',
  '399108': '深证B指',
  '399333': '中小板R',
  '399550': '央视50',
  '399551': '央视50R',
  '399552': '央视财经50',
  '399553': '央视财经50R',
  '399554': '深证央视50',
  '399555': '深证央视50R',
  '399556': '央视创新',
  '399557': '央视创新R',
  '399558': '深证央视创新',
  '399559': '深证央视创新R',
  '399560': '国证A指',
  '399561': '国证A指R',
  '399562': '国证综指',
  '399563': '国证综指R',
  '399564': '国证指数',
  '399565': '国证指数R',
  '399566': '国证流通',
  '399567': '国证流通R',
  '399568': '国证红利',
  '399569': '国证红利R',
  '399570': '国证成长',
  '399571': '国证成长R',
  '399572': '国证价值',
  '399573': '国证价值R',
  '399574': '国证治理',
  '399575': '国证治理R',
  '399576': '国证责任',
  '399577': '国证责任R',
  '399578': '国证服务',
  '399579': '国证服务R',
  '399580': '国证消费',
  '399581': '国证消费R',
  '399582': '国证地产',
  '399583': '国证地产R',
  '399584': '国证资源',
  '399585': '国证资源R',
  '399586': '国证新能',
  '399587': '国证新能R',
  '399588': '国证环保',
  '399589': '国证环保R',
  '399590': '国证军工',
  '399591': '国证军工R',
  '399592': '国证新材',
  '399593': '国证新材R',
  '399594': '国证医药',
  '399595': '国证医药R',
  '399596': '国证食品',
  '399597': '国证食品R',
  '399598': '国证有色',
  '399599': '国证有色R',
  '399600': '国证新兴',
  '399601': '国证新兴R',
  '399602': '国证消费',
  '399603': '国证消费R',
  '399604': '国证地产',
  '399605': '国证地产R',
  '399606': '国证资源',
  '399607': '国证资源R',
  '399608': '国证新能',
  '399609': '国证新能R',
  '399610': '国证环保',
  '399611': '国证环保R',
  '399612': '国证军工',
  '399613': '国证军工R',
  '399614': '国证新材',
  '399615': '国证新材R',
  '399616': '国证医药',
  '399617': '国证医药R',
  '399618': '国证食品',
  '399619': '国证食品R',
  '399620': '国证有色',
  '399621': '国证有色R',
  '399622': '国证新兴',
  '399623': '国证新兴R',
  '399624': '国证消费',
  '399625': '国证消费R',
  '399626': '国证地产',
  '399627': '国证地产R',
  '399628': '国证资源',
  '399629': '国证资源R',
  '399630': '国证新能',
  '399631': '国证新能R',
  '399632': '国证环保',
  '399633': '国证环保R',
  '399634': '国证军工',
  '399635': '国证军工R',
  '399636': '国证新材',
  '399637': '国证新材R',
  '399638': '国证医药',
  '399639': '国证医药R',
  '399640': '国证食品',
  '399641': '国证食品R',
  '399642': '国证有色',
  '399643': '国证有色R',
  '399644': '国证新兴',
  '399645': '国证新兴R',
  '399646': '国证消费',
  '399647': '国证消费R',
  '399648': '国证地产',
  '399649': '国证地产R',
  '399650': '国证资源',
  '399651': '国证资源R',
  '399652': '国证新能',
  '399653': '国证新能R',
  '399654': '国证环保',
  '399655': '国证环保R',
  '399656': '国证军工',
  '399657': '国证军工R',
  '399658': '国证新材',
  '399659': '国证新材R',
  '399660': '国证医药',
  '399661': '国证医药R',
  '399662': '国证食品',
  '399663': '国证食品R',
  '399664': '国证有色',
  '399665': '国证有色R',
  '399666': '国证新兴',
  '399667': '国证新兴R',
  '399668': '国证消费',
  '399669': '国证消费R',
  '399670': '国证地产',
  '399671': '国证地产R',
  '399672': '国证资源',
  '399673': '国证资源R',
  '399674': '国证新能',
  '399675': '国证新能R',
  '399676': '国证环保',
  '399677': '国证环保R',
  '399678': '国证军工',
  '399679': '国证军工R',
  '399680': '国证新材',
  '399681': '国证新材R',
  '399682': '国证医药',
  '399683': '国证医药R',
  '399684': '国证食品',
  '399685': '国证食品R',
  '399686': '国证有色',
  '399687': '国证有色R',
  '399688': '国证新兴',
  '399689': '国证新兴R',
  '399690': '国证消费',
  '399691': '国证消费R',
  '399692': '国证地产',
  '399693': '国证地产R',
  '399694': '国证资源',
  '399695': '国证资源R',
  '399696': '国证新能',
  '399697': '国证新能R',
  '399698': '国证环保',
  '399699': '国证环保R',
};

/**
 * 加密货币的中文名称映射
 */
const CRYPTO_NAMES: Record<string, string> = {
  // 主要加密货币
  'BTCUSDT': '比特币',
  'BTC/USDT': '比特币',
  'ETHUSDT': '以太坊',
  'ETH/USDT': '以太坊',
  'BNBUSDT': 'BNB币',
  'BNB/USDT': 'BNB币',
  'XRPUSDT': '瑞波币',
  'XRP/USDT': '瑞波币',
  'ADAUSDT': '艾达币',
  'ADA/USDT': '艾达币',
  'SOLUSDT': '索拉纳',
  'SOL/USDT': '索拉纳',
  'DOGEUSDT': '狗狗币',
  'DOGE/USDT': '狗狗币',
  'DOTUSDT': '波卡币',
  'DOT/USDT': '波卡币',
  'MATICUSDT': '马蹄币',
  'MATIC/USDT': '马蹄币',
  'SHIBUSDT': '柴犬币',
  'SHIB/USDT': '柴犬币',
  'AVAXUSDT': '雪崩币',
  'AVAX/USDT': '雪崩币',
  'LTCUSDT': '莱特币',
  'LTC/USDT': '莱特币',
  'UNIUSDT': 'Uniswap',
  'UNI/USDT': 'Uniswap',
  'LINKUSDT': 'Chainlink',
  'LINK/USDT': 'Chainlink',
  'BCHUSDT': '比特币现金',
  'BCH/USDT': '比特币现金',
  'XLMUSDT': '恒星币',
  'XLM/USDT': '恒星币',
  'ALGOUSDT': 'Algorand',
  'ALGO/USDT': 'Algorand',
  'VETUSDT': '唯链',
  'VET/USDT': '唯链',
  'ICPUSDT': 'Internet Computer',
  'ICP/USDT': 'Internet Computer',
  'FILUSDT': 'Filecoin',
  'FIL/USDT': 'Filecoin',
  'TRXUSDT': '波场币',
  'TRX/USDT': '波场币',
  'ETCUSDT': '以太坊经典',
  'ETC/USDT': '以太坊经典',
  'XMRUSDT': '门罗币',
  'XMR/USDT': '门罗币',
  'HBARUSDT': 'Hedera',
  'HBAR/USDT': 'Hedera',
  'NEARUSDT': 'NEAR Protocol',
  'NEAR/USDT': 'NEAR Protocol',
  'ATOMUSDT': 'Cosmos',
  'ATOM/USDT': 'Cosmos',
  'MANAUSDT': 'Decentraland',
  'MANA/USDT': 'Decentraland',
  'SANDUSDT': 'The Sandbox',
  'SAND/USDT': 'The Sandbox',
  'AXSUSDT': 'Axie Infinity',
  'AXS/USDT': 'Axie Infinity',
  'THETAUSDT': 'Theta Network',
  'THETA/USDT': 'Theta Network',
  'FTMUSDT': 'Fantom',
  'FTM/USDT': 'Fantom',
  'EOSUSDT': 'EOS',
  'EOS/USDT': 'EOS',
  'AAVEUSDT': 'Aave',
  'AAVE/USDT': 'Aave',
  'MKRUSDT': 'Maker',
  'MKR/USDT': 'Maker',
  'COMPUSDT': 'Compound',
  'COMP/USDT': 'Compound',
  'SNXUSDT': 'Synthetix',
  'SNX/USDT': 'Synthetix',
  'CRVUSDT': 'Curve DAO Token',
  'CRV/USDT': 'Curve DAO Token',
  'YFIUSDT': 'yearn.finance',
  'YFI/USDT': 'yearn.finance',
  '1INCHUSDT': '1inch',
  '1INCH/USDT': '1inch',
  'SUSHIUSDT': 'SushiSwap',
  'SUSHI/USDT': 'SushiSwap',
  'KSMUSDT': 'Kusama',
  'KSM/USDT': 'Kusama',
  'DASHUSDT': '达世币',
  'DASH/USDT': '达世币',
  'ZECUSDT': '大零币',
  'ZEC/USDT': '大零币',
  'XTZUSDT': 'Tezos',
  'XTZ/USDT': 'Tezos',
  'QTUMUSDT': '量子链',
  'QTUM/USDT': '量子链',
  'OMGUSDT': 'OMG Network',
  'OMG/USDT': 'OMG Network',
  'ZRXUSDT': '0x',
  'ZRX/USDT': '0x',
  'BATUSDT': 'Basic Attention Token',
  'BAT/USDT': 'Basic Attention Token',
  'ENJUSDT': 'Enjin Coin',
  'ENJ/USDT': 'Enjin Coin',
  'RENUSDT': 'Ren',
  'REN/USDT': 'Ren',
  'RLCUSDT': 'iExec RLC',
  'RLC/USDT': 'iExec RLC',
  'STORJUSDT': 'Storj',
  'STORJ/USDT': 'Storj',
  'KNCUSDT': 'Kyber Network Crystal',
  'KNC/USDT': 'Kyber Network Crystal',
  'BANDUSDT': 'Band Protocol',
  'BAND/USDT': 'Band Protocol',
  'RSRUSDT': 'Reserve Rights',
  'RSR/USDT': 'Reserve Rights',
  'LRCUSDT': 'Loopring',
  'LRC/USDT': 'Loopring',
  'BALUSDT': 'Balancer',
  'BAL/USDT': 'Balancer',
  'NMRUSDT': 'Numeraire',
  'NMR/USDT': 'Numeraire',
  'CHZUSDT': 'Chiliz',
  'CHZ/USDT': 'Chiliz',
  'HOTUSDT': 'Holo',
  'HOT/USDT': 'Holo',
  'ZILUSDT': 'Zilliqa',
  'ZIL/USDT': 'Zilliqa',
  'FETUSDT': 'Fetch.ai',
  'FET/USDT': 'Fetch.ai',
  'OCEANUSDT': 'Ocean Protocol',
  'OCEAN/USDT': 'Ocean Protocol',
  'CELRUSDT': 'Celer Network',
  'CELR/USDT': 'Celer Network',
  'ONEUSDT': 'Harmony',
  'ONE/USDT': 'Harmony',
  'CHRUSDT': 'Chromia',
  'CHR/USDT': 'Chromia',
  'BTTUSDT': 'BitTorrent',
  'BTT/USDT': 'BitTorrent',
  'STXUSDT': 'Stacks',
  'STX/USDT': 'Stacks',
  'KAVAUSDT': 'Kava',
  'KAVA/USDT': 'Kava',
  'ARPAUSDT': 'ARPA Chain',
  'ARPA/USDT': 'ARPA Chain',
  'IOTXUSDT': 'IoTeX',
  'IOTX/USDT': 'IoTeX',
  'RVNUSDT': 'Ravencoin',
  'RVN/USDT': 'Ravencoin',
  'NKNUSDT': 'NKN',
  'NKN/USDT': 'NKN',
  'WANUSDT': 'Wanchain',
  'WAN/USDT': 'Wanchain',
  'NULSUSDT': 'NULS',
  'NULS/USDT': 'NULS',
  'COSUSDT': 'Contentos',
  'COS/USDT': 'Contentos',
  'KEYUSDT': 'SelfKey',
  'KEY/USDT': 'SelfKey',
  'VITEUSDT': 'VITE',
  'VITE/USDT': 'VITE',
  'TFUELUSDT': 'Theta Fuel',
  'TFUEL/USDT': 'Theta Fuel',
  'CTKUSDT': 'CertiK',
  'CTK/USDT': 'CertiK',
  'AKROUSDT': 'Akropolis',
  'AKRO/USDT': 'Akropolis',
  'HNTUSDT': 'Helium',
  'HNT/USDT': 'Helium',
  'SCUSDT': 'Siacoin',
  'SC/USDT': 'Siacoin',
  'DGBUSDT': 'DigiByte',
  'DGB/USDT': 'DigiByte',
  'BTSUSDT': 'BitShares',
  'BTS/USDT': 'BitShares',
  'LSKUSDT': 'Lisk',
  'LSK/USDT': 'Lisk',
  'BZRXUSDT': 'bZx Protocol',
  'BZRX/USDT': 'bZx Protocol',
  'COTIUSDT': 'COTI',
  'COTI/USDT': 'COTI',
  'STMXUSDT': 'StormX',
  'STMX/USDT': 'StormX',
  'WTCUSDT': 'Waltonchain',
  'WTC/USDT': 'Waltonchain',
  'DATAUSDT': 'Streamr',
  'DATA/USDT': 'Streamr',
  'XVSUSDT': 'Venus',
  'XVS/USDT': 'Venus',
  'SXPUSDT': 'Swipe',
  'SXP/USDT': 'Swipe',
  'DCRUSDT': 'Decred',
  'DCR/USDT': 'Decred',
  'KMDUSDT': 'Komodo',
  'KMD/USDT': 'Komodo',
  'REPUSDT': 'Augur',
  'REP/USDT': 'Augur',
  'LENDUSDT': 'Aave [OLD]',
  'LEND/USDT': 'Aave [OLD]',
  'WRXUSDT': 'WazirX',
  'WRX/USDT': 'WazirX',
  'LTOLUSDT': 'LTO Network',
  'LTO/USDT': 'LTO Network',
  'MBLUSDT': 'MovieBloc',
  'MBL/USDT': 'MovieBloc',
  'CAKEUSDT': 'PancakeSwap',
  'CAKE/USDT': 'PancakeSwap',
  'BURGERUSDT': 'BurgerCities',
  'BURGER/USDT': 'BurgerCities',
  'BAKEUSDT': 'BakeryToken',
  'BAKE/USDT': 'BakeryToken',
  'FLMUSDT': 'Flamingo',
  'FLM/USDT': 'Flamingo',
  'SCRTUSDT': 'Secret',
  'SCRT/USDT': 'Secret',
  'ALPACAUSDT': 'Alpaca Finance',
  'ALPACA/USDT': 'Alpaca Finance',
  'QUICKUSDT': 'QuickSwap',
  'QUICK/USDT': 'QuickSwap',
  'ORNUSDT': 'Orion Protocol',
  'ORN/USDT': 'Orion Protocol',
  'FORTHUSDT': 'Ampleforth Governance Token',
  'FORTH/USDT': 'Ampleforth Governance Token',
  'EASYUSDT': 'EASY',
  'EASY/USDT': 'EASY',
  'AUDIOUSDT': 'Audius',
  'AUDIO/USDT': 'Audius',
  'C98USDT': 'Coin98',
  'C98/USDT': 'Coin98',
  'MASKUSDT': 'Mask Network',
  'MASK/USDT': 'Mask Network',
  'YGGUSDT': 'Yield Guild Games',
  'YGG/USDT': 'Yield Guild Games',
  'FIDAUSDT': 'Boba Network',
  'FIDA/USDT': 'Boba Network',
  'SKLUSDT': 'SKALE Network',
  'SKL/USDT': 'SKALE Network',
  'GRTUSDT': 'The Graph',
  'GRT/USDT': 'The Graph',
  'NUUSDT': 'NuCypher',
  'NU/USDT': 'NuCypher',
  'XEMUSDT': 'NEM',
  'XEM/USDT': 'NEM',
  'BTGUSDT': 'Bitcoin Gold',
  'BTG/USDT': 'Bitcoin Gold',
  'OGNUSDT': 'Origin Protocol',
  'OGN/USDT': 'Origin Protocol',
  'REEFUSDT': 'Reef',
  'REEF/USDT': 'Reef',
  'KLAYUSDT': 'Klaytn',
  'KLAY/USDT': 'Klaytn',
  'PHAUSDT': 'Phala Network',
  'PHA/USDT': 'Phala Network',
  'TORNUSDT': 'Tornado Cash',
  'TORN/USDT': 'Tornado Cash',
  'LITUSDT': 'Litentry',
  'LIT/USDT': 'Litentry',
  'SFPUSDT': 'SafePal',
  'SFP/USDT': 'SafePal',
  'DOGECOIN': '狗狗币',
  'BITCOIN': '比特币',
  'ETHEREUM': '以太坊',
  'BINANCECOIN': 'BNB币',
  'RIPPLE': '瑞波币',
  'CARDANO': '艾达币',
  'SOLANA': '索拉纳',
  'POLKADOT': '波卡币',
  'POLYGON': '马蹄币',
  'SHIBAINU': '柴犬币',
  'AVALANCHE': '雪崩币',
  'LITECOIN': '莱特币',
  'UNISWAP': 'Uniswap',
  'CHAINLINK': 'Chainlink',
  'BITCOINCASH': '比特币现金',
  'STELLAR': '恒星币',
  'ALGORAND': 'Algorand',
  'VECHAIN': '唯链',
  'INTERNETCOMPUTER': 'Internet Computer',
  'FILECOIN': 'Filecoin',
  'TRON': '波场币',
  'ETHEREUMCLASSIC': '以太坊经典',
  'MONERO': '门罗币',
  'HEDERA': 'Hedera',
  'NEARPROTOCOL': 'NEAR Protocol',
  'COSMOS': 'Cosmos',
  'DECENTRALAND': 'Decentraland',
  'THESANDBOX': 'The Sandbox',
  'AXIEINFINITE': 'Axie Infinity',
  'THETANETWORK': 'Theta Network',
  'FANTOM': 'Fantom',
  'EOS': 'EOS',
  'AAVE': 'Aave',
  'MAKER': 'Maker',
  'COMPOUND': 'Compound',
  'SYNTHETIX': 'Synthetix',
  'CURVEDAOTOKEN': 'Curve DAO Token',
  'YEARNFINANCE': 'yearn.finance',
  'SUSHISWAP': 'SushiSwap',
  'KUSAMA': 'Kusama',
  'DASH': '达世币',
  'ZCASH': '大零币',
  'TEZOS': 'Tezos',
  'QTUM': '量子链',
  'OMGNETWORK': 'OMG Network',
  'BASICATTENTIONTOKEN': 'Basic Attention Token',
  'ENJINCOIN': 'Enjin Coin',
  'REN': 'Ren',
  'IEXECRLC': 'iExec RLC',
  'STORJ': 'Storj',
  'KYBERNETWORKCRYSTAL': 'Kyber Network Crystal',
  'BANDPROTOCOL': 'Band Protocol',
  'RESERVERIGHTS': 'Reserve Rights',
  'LOOPRING': 'Loopring',
  'BALANCER': 'Balancer',
  'NUMERAIRE': 'Numeraire',
  'CHILIZ': 'Chiliz',
  'HOLO': 'Holo',
  'ZILLIQA': 'Zilliqa',
  'FETCHAI': 'Fetch.ai',
  'OCEANPROTOCOL': 'Ocean Protocol',
  'CELERNETWORK': 'Celer Network',
  'HARMONY': 'Harmony',
  'CHROMIA': 'Chromia',
  'BITTORRENT': 'BitTorrent',
  'STACKS': 'Stacks',
  'KAVA': 'Kava',
  'ARPACHAIN': 'ARPA Chain',
  'IOTEX': 'IoTeX',
  'RAVENCOIN': 'Ravencoin',
  'NKN': 'NKN',
  'WANCHAIN': 'Wanchain',
  'NULS': 'NULS',
  'CONTENTOS': 'Contentos',
  'SELFKEY': 'SelfKey',
  'VITE': 'VITE',
  'THETAFUEL': 'Theta Fuel',
  'CERTIK': 'CertiK',
  'AKROPOLIS': 'Akropolis',
  'HELIUM': 'Helium',
  'SIACOIN': 'Siacoin',
  'DIGIBYTE': 'DigiByte',
  'BITSHARES': 'BitShares',
  'LISK': 'Lisk',
  'COTI': 'COTI',
  'STORMX': 'StormX',
  'WALTONCHAIN': 'Waltonchain',
  'STREAMR': 'Streamr',
  'VENUS': 'Venus',
  'SWIPE': 'Swipe',
  'DECRED': 'Decred',
  'KOMODO': 'Komodo',
  'AUGUR': 'Augur',
  'WAZIRX': 'WazirX',
  'LTONETWORK': 'LTO Network',
  'MOVIEBLOC': 'MovieBloc',
  'PANCAKESWAP': 'PancakeSwap',
  'BURGERCITIES': 'BurgerCities',
  'BAKERYTOKEN': 'BakeryToken',
  'FLAMINGO': 'Flamingo',
  'SECRET': 'Secret',
  'ALPACAFINANCE': 'Alpaca Finance',
  'QUICKSWAP': 'QuickSwap',
  'ORIONPROTOCOL': 'Orion Protocol',
  'AMPLEFORTHGOVERNANCETOKEN': 'Ampleforth Governance Token',
  'EASY': 'EASY',
  'AUDIUS': 'Audius',
  'COIN98': 'Coin98',
  'MASKNETWORK': 'Mask Network',
  'YIELDGUILDGAMES': 'Yield Guild Games',
  'BOBANETWORK': 'Boba Network',
  'SKALENETWORK': 'SKALE Network',
  'THEGRAPH': 'The Graph',
  'NUCYPHER': 'NuCypher',
  'NEM': 'NEM',
  'BITCOINGOLD': 'Bitcoin Gold',
  'ORIGINPROTOCOL': 'Origin Protocol',
  'REEF': 'Reef',
  'KLAYTN': 'Klaytn',
  'PHALANETWORK': 'Phala Network',
  'TORNADOCASH': 'Tornado Cash',
  'LITENTRY': 'Litentry',
  'SAFEPAL': 'SafePal',
};

/**
 * 合并CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 验证日期字符串是否有效
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 格式化日期时间为中文显示格式
 * 注意：后端提供 UTC 时间，前端将根据用户本地时区进行显示。
 */
export function formatDateTime(dateString: string): string {
  try {
    if (!isValidDate(dateString)) {
      throw new Error('Invalid date');
    }
    const date = new Date(dateString);
    // 后端提供 UTC 时间，直接格式化显示为用户本地时区
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 使用24小时制
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '数据更新时间未知';
  }
}

/**
 * 标准化UTC日期字符串
 */
export function normalizeUtcDate(dateString: string): string {
  try {
    if (!isValidDate(dateString)) {
      throw new Error('Invalid date');
    }
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.warn('Date normalization error:', error);
    return new Date().toISOString(); // 返回当前时间作为后备
  }
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: string): string {
  // 如果已经包含%符号，直接返回
  if (value.includes('%')) {
    return value;
  }
  // 否则添加%符号
  return `${value}%`;
}

/**
 * 获取预测方向的颜色类名
 * 符合中国习惯：上涨红色，下跌绿色
 */
export function getDirectionColor(direction: 'Up' | 'Down'): string {
  return direction === 'Up' ? 'text-red-600' : 'text-green-600';
}

/**
 * 获取预测方向的图标
 */
export function getDirectionIcon(direction: 'Up' | 'Down'): string {
  return direction === 'Up' ? '↗' : '↘';
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否为有效的Base64图片数据
 */
export function isValidBase64Image(base64String: string): boolean {
  try {
    // 检查是否以data:image开头或者是纯base64字符串
    const isDataUrl = base64String.startsWith('data:image/');
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64String);
    
    return isDataUrl || (isBase64 && base64String.length > 0);
  } catch {
    return false;
  }
}

/**
 * 格式化Base64图片数据URL
 */
export function formatImageDataUrl(base64String: string): string {
  if (base64String.startsWith('data:image/')) {
    return base64String;
  }
  return `data:image/png;base64,${base64String}`;
}

/**
 * 根据标的代码识别市场类型
 */
export function getMarketType(symbol: string): MarketType {
  // 加密货币通常以USDT结尾
  if (symbol.endsWith('USDT')) {
    return MarketType.CRYPTO;
  }
  // 股指通常是纯数字代码
  if (/^\d+$/.test(symbol)) {
    return MarketType.INDEX;
  }
  // 默认返回加密货币类型
  return MarketType.CRYPTO;
}

/**
 * 获取市场信息
 */
export function getMarketInfo(marketType: MarketType): MarketInfo {
  const marketInfoMap: Record<MarketType, MarketInfo> = {
    [MarketType.CRYPTO]: {
      type: MarketType.CRYPTO,
      name: '加密货币市场',
      icon: '₿',
      description: '数字资产交易市场'
    },
    [MarketType.INDEX]: {
      type: MarketType.INDEX,
      name: '股指市场',
      icon: '🎯',
      description: '股票指数市场'
    }
  };
  
  return marketInfoMap[marketType];
}

/**
 * 格式化加密货币符号为标准格式 (如: ETHUSDT -> ETH/USDT)
 * @param symbol 原始符号
 * @returns 格式化后的符号
 */
export function formatCryptoSymbol(symbol: string): string {
  // 如果已经包含斜杠，直接返回
  if (symbol.includes('/')) {
    return symbol;
  }
  
  // 如果以USDT结尾，添加斜杠分隔
  if (symbol.endsWith('USDT')) {
    const baseSymbol = symbol.replace('USDT', '');
    return `${baseSymbol}/USDT`;
  }
  
  // 处理其他常见的交易对格式
  if (symbol.endsWith('USDC')) {
    const baseSymbol = symbol.replace('USDC', '');
    return `${baseSymbol}/USDC`;
  }
  
  if (symbol.endsWith('BTC')) {
    const baseSymbol = symbol.replace('BTC', '');
    return `${baseSymbol}/BTC`;
  }
  
  if (symbol.endsWith('ETH')) {
    const baseSymbol = symbol.replace('ETH', '');
    return `${baseSymbol}/ETH`;
  }
  
  // 如果不匹配任何模式，返回原始符号
  return symbol;
}

/**
 * 获取格式化的标的符号显示
 * @param symbol 原始标的代码
 * @param marketType 市场类型（可选，如果不提供会自动识别）
 * @returns 格式化后的符号
 */
export function getFormattedSymbol(symbol: string, marketType?: MarketType): string {
  const detectedMarketType = marketType || getMarketType(symbol);
  
  if (detectedMarketType === MarketType.CRYPTO) {
    return formatCryptoSymbol(symbol);
  }
  
  return symbol;
}

/**
 * 获取标的的中文通用名称
 * @param symbol 标的代码
 * @param marketType 市场类型（可选，如果不提供会自动识别）
 * @returns 中文名称，如果找不到则返回原始代码
 */
export function getSymbolDisplayName(symbol: string, marketType?: MarketType): string {
  const detectedMarketType = marketType || getMarketType(symbol);
  
  if (detectedMarketType === MarketType.INDEX) {
    return STOCK_INDEX_NAMES[symbol] || symbol;
  } else if (detectedMarketType === MarketType.CRYPTO) {
    return CRYPTO_NAMES[symbol] || CRYPTO_NAMES[symbol.toUpperCase()] || symbol;
  }
  
  return symbol;
}

/**
 * 检测是否为移动端设备
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 检查用户代理
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // 检查屏幕宽度
  const isSmallScreen = window.innerWidth <= 768;
  
  // 检查触摸支持
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isSmallScreen && isTouchDevice);
}

/**
 * 检测是否为小屏幕设备（包括平板竖屏）
 */
export function isSmallScreen(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

/**
 * 使用 React Hook 检测移动端设备
 */
export function useIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);
  
  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobileDevice(isMobile());
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobileDevice;
}

/**
 * 按市场类型分组预测数据
 * 排序：先股指市场，再加密货币市场
 */
export function groupPredictionsByMarket(predictions: Record<string, any>): Record<MarketType, Record<string, any>> {
  const grouped: Record<MarketType, Record<string, any>> = {
    [MarketType.INDEX]: {},
    [MarketType.CRYPTO]: {}
  };

  // 先按市场类型分组
  Object.entries(predictions).forEach(([symbol, prediction]) => {
    const marketType = getMarketType(symbol);
    grouped[marketType][symbol] = {
      ...prediction,
      market_type: marketType,
      display_name: getSymbolDisplayName(symbol, marketType)
    };
  });

  // 对每个市场内的标的进行排序
  Object.keys(grouped).forEach((marketType) => {
    const sortedEntries = Object.entries(grouped[marketType as MarketType]).sort((a, b) => {
      // 如果是股指市场，让上证指数（000001）排在最前面
      if (marketType === MarketType.INDEX) {
        if (a[0] === '000001') return -1;
        if (b[0] === '000001') return 1;
      }
      return a[0].localeCompare(b[0]);
    });
    
    grouped[marketType as MarketType] = Object.fromEntries(sortedEntries);
  });

  return grouped;
}
