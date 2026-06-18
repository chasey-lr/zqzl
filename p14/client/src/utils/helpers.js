export function getAvatarColor(name) {
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911',
    '#096dd9', '#389e0d', '#d48806', '#cf1322', '#531dab'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function getFirstLetter(name) {
  if (!name) return '#';
  const firstChar = name.charAt(0).toUpperCase();
  return firstChar;
}

export function getPinyinInitial(name) {
  if (!name) return '#';
  const pinyinMap = {
    'A': '啊阿呵吖嗄腌', 'B': '八不把白百半北本比变边表别宾波部步不',
    'C': '才参残草册层茶差长常场超车成城吃尺重出初除传春次从错',
    'D': '大代带当岛道理德等低地典电店丁东冬动都度对多',
    'E': '俄饿鹅额恶厄',
    'F': '发法番凡反方飞非分风封丰夫服福府父付',
    'G': '该改概甘干敢高哥歌格个各根更工公功共够古故顾瓜挂关官光广归贵国果过',
    'H': '哈海含汉杭好号河何和黑很红后户花化画话欢还黄回会混活火或',
    'J': '机及级极急己计记纪季家加假价架坚间减见建剑江将讲交教节结姐界今金近进近京经精景净静九久旧酒就局举具据决绝',
    'K': '开看康考科可课肯空口苦快宽况困',
    'L': '拉来蓝烂老乐雷冷类离里理力历立丽利连脸练良两亮了料林临零流六龙楼路录旅绿乱论罗落',
    'M': '妈马买满慢忙毛没每美妹门们米密面民明命末莫母目木',
    'N': '拿哪那南男难脑呢能你年念鸟您牛农浓努怒女暖',
    'O': '哦噢喔',
    'P': '怕派盘判旁跑朋皮片票平评破普',
    'Q': '七起气汽千前钱浅强桥亲青清情请秋球区曲去全群',
    'R': '然让热人认日荣肉如入软',
    'S': '三散桑色森僧山商上少社设舍深身神生声胜省失十时实识史世市事试室是适视书叔树数双谁水说思私死四寺送诉速算虽随岁所',
    'T': '他她它台太态谈探汤堂糖桃套特天田条铁听同通头图团推退脱',
    'W': '挖完晚万王网往望忘威危微为围位文闻问我握无五午武务物误',
    'X': '西希息习喜洗系戏细下先现线县相香想响向像小象笑些鞋写谢心新信星兴性姓行形醒幸福休修需许续选学',
    'Y': '呀牙亚严言颜眼演验羊阳样药要也野业叶夜一衣医依宜遗已以亿义艺议易疫亦意因音阴银引印应英迎影硬永用优由油游友有又右于余鱼娱与语雨遇玉育域原园圆远院愿月越云运',
    'Z': '杂在再咱暂脏早造则责怎增曾扎展站战张长掌找照这着真针正政证之知只直指止志制质治中钟终种重周州洲粥轴皱骤朱诸主注祝驻转赚庄装壮状追准桌着资子自字宗总走租族组嘴最左坐做'
  };

  const firstChar = name.charAt(0);
  
  if (/^[a-zA-Z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  
  if (/^[\u4e00-\u9fa5]/.test(firstChar)) {
    for (const letter in pinyinMap) {
      if (pinyinMap[letter].includes(firstChar)) {
        return letter;
      }
    }
  }
  
  return '#';
}

export function groupContactsByInitial(contacts) {
  const groups = {};
  
  contacts.forEach(contact => {
    const initial = getPinyinInitial(contact.name);
    if (!groups[initial]) {
      groups[initial] = [];
    }
    groups[initial].push(contact);
  });
  
  const letters = Object.keys(groups).sort();
  const result = [];
  
  letters.forEach(letter => {
    result.push({
      letter,
      contacts: groups[letter].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    });
  });
  
  return result;
}

export function formatPhone(phone) {
  if (!phone) return '';
  if (phone.length === 11) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  return phone;
}
