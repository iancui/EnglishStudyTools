import { Word, Sentence } from '../types/index.ts';

export const SEED_WORDS: Word[] = [
  {
    id: 'w-1',
    text: 'holiday',
    phoneticUk: '/ˈhɒlədeɪ/',
    phoneticUs: '/ˈhɑːlədeɪ/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-1',
        wordId: 'w-1',
        pos: 'n.',
        definitionCn: '假期；假日；节日',
        definitionEn: 'a time of rest from work, school etc.',
        exampleEn: 'Where did you go during the holiday?',
        exampleCn: '假期你去了哪里？'
      }
    ],
    phonics: [
      { id: 'wp-1-1', wordId: 'w-1', sequence: 1, text: 'hol', phonetic: '/hɒl/', syllable: 'hol' },
      { id: 'wp-1-2', wordId: 'w-1', sequence: 2, text: 'i', phonetic: '/ə/', syllable: 'i' },
      { id: 'wp-1-3', wordId: 'w-1', sequence: 3, text: 'day', phonetic: '/deɪ/', syllable: 'day' }
    ]
  },
  {
    id: 'w-2',
    text: 'where',
    phoneticUk: '/weə(r)/',
    phoneticUs: '/wer/',
    pos: 'adv.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-2',
        wordId: 'w-2',
        pos: 'adv.',
        definitionCn: '在哪里；向哪里',
        definitionEn: 'at, in, or to what place or position',
        exampleEn: 'Where is the nearest bus stop?',
        exampleCn: '最近的公交站在哪里？'
      }
    ],
    phonics: [
      { id: 'wp-2-1', wordId: 'w-2', sequence: 1, text: 'wh', phonetic: '/w/', syllable: 'wh' },
      { id: 'wp-2-2', wordId: 'w-2', sequence: 2, text: 'ere', phonetic: '/eə(r)/', syllable: 'ere' }
    ]
  },
  {
    id: 'w-3',
    text: 'during',
    phoneticUk: '/ˈdjʊərɪŋ/',
    phoneticUs: '/ˈdʊrɪŋ/',
    pos: 'prep.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-3',
        wordId: 'w-3',
        pos: 'prep.',
        definitionCn: '在……期间',
        definitionEn: 'throughout the entire time of an event or period',
        exampleEn: 'She remained silent during the meeting.',
        exampleCn: '会议期间她保持沉默。'
      }
    ],
    phonics: [
      { id: 'wp-3-1', wordId: 'w-3', sequence: 1, text: 'dur', phonetic: '/djʊər/', syllable: 'dur' },
      { id: 'wp-3-2', wordId: 'w-3', sequence: 2, text: 'ing', phonetic: '/ɪŋ/', syllable: 'ing' }
    ]
  },
  {
    id: 'w-4',
    text: 'computer',
    phoneticUk: '/kəmˈpjuːtə(r)/',
    phoneticUs: '/kəmˈpjuːtər/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-4',
        wordId: 'w-4',
        pos: 'n.',
        definitionCn: '计算机；电脑',
        definitionEn: 'an electronic device for storing and processing data',
        exampleEn: 'I use my computer for online research.',
        exampleCn: '我用电脑做在线调研。'
      }
    ],
    phonics: [
      { id: 'wp-4-1', wordId: 'w-4', sequence: 1, text: 'com', phonetic: '/kəm/', syllable: 'com' },
      { id: 'wp-4-2', wordId: 'w-4', sequence: 2, text: 'pu', phonetic: '/pjuː/', syllable: 'pu' },
      { id: 'wp-4-3', wordId: 'w-4', sequence: 3, text: 'ter', phonetic: '/tər/', syllable: 'ter' }
    ]
  },
  {
    id: 'w-5',
    text: 'beautiful',
    phoneticUk: '/ˈbjuːtɪfl/',
    phoneticUs: '/ˈbjuːt̬ɪfəl/',
    pos: 'adj.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-5',
        wordId: 'w-5',
        pos: 'adj.',
        definitionCn: '美丽的；漂亮的；优美的',
        definitionEn: 'pleasing the senses or mind aesthetically',
        exampleEn: 'The sunrise this morning was truly beautiful.',
        exampleCn: '今晨的日出非常美丽。'
      }
    ],
    phonics: [
      { id: 'wp-5-1', wordId: 'w-5', sequence: 1, text: 'beau', phonetic: '/bjuː/', syllable: 'beau' },
      { id: 'wp-5-2', wordId: 'w-5', sequence: 2, text: 'ti', phonetic: '/tɪ/', syllable: 'ti' },
      { id: 'wp-5-3', wordId: 'w-5', sequence: 3, text: 'ful', phonetic: '/fəl/', syllable: 'ful' }
    ]
  },
  {
    id: 'w-6',
    text: 'important',
    phoneticUk: '/ɪmˈpɔːtnt/',
    phoneticUs: '/ɪmˈpɔːrtnt/',
    pos: 'adj.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-6',
        wordId: 'w-6',
        pos: 'adj.',
        definitionCn: '重要的；重大的',
        definitionEn: 'of great significance or value',
        exampleEn: 'Health is the most important thing in life.',
        exampleCn: '健康是人生中最重要的东西。'
      }
    ],
    phonics: [
      { id: 'wp-6-1', wordId: 'w-6', sequence: 1, text: 'im', phonetic: '/ɪm/', syllable: 'im' },
      { id: 'wp-6-2', wordId: 'w-6', sequence: 2, text: 'por', phonetic: '/pɔːr/', syllable: 'por' },
      { id: 'wp-6-3', wordId: 'w-6', sequence: 3, text: 'tant', phonetic: '/tnt/', syllable: 'tant' }
    ]
  },
  {
    id: 'w-7',
    text: 'school',
    phoneticUk: '/skuːl/',
    phoneticUs: '/skuːl/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-7',
        wordId: 'w-7',
        pos: 'n.',
        definitionCn: '学校；上学',
        definitionEn: 'an institution for educating children',
        exampleEn: 'He walks to school every weekday morning.',
        exampleCn: '他每个工作日早晨都走路去上学。'
      }
    ],
    phonics: [
      { id: 'wp-7-1', wordId: 'w-7', sequence: 1, text: 'sch', phonetic: '/sk/', syllable: 'sch' },
      { id: 'wp-7-2', wordId: 'w-7', sequence: 2, text: 'ool', phonetic: '/uːl/', syllable: 'ool' }
    ]
  },
  {
    id: 'w-8',
    text: 'teacher',
    phoneticUk: '/ˈtiːtʃə(r)/',
    phoneticUs: '/ˈtiːtʃər/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-8',
        wordId: 'w-8',
        pos: 'n.',
        definitionCn: '教师；老师',
        definitionEn: 'a person who teaches, especially in a school',
        exampleEn: 'Our teacher explains grammar clearly.',
        exampleCn: '我们的老师把语法讲得很透彻。'
      }
    ],
    phonics: [
      { id: 'wp-8-1', wordId: 'w-8', sequence: 1, text: 'teach', phonetic: '/tiːtʃ/', syllable: 'teach' },
      { id: 'wp-8-2', wordId: 'w-8', sequence: 2, text: 'er', phonetic: '/ər/', syllable: 'er' }
    ]
  },
  {
    id: 'w-9',
    text: 'student',
    phoneticUk: '/ˈstjuːdnt/',
    phoneticUs: '/ˈstuːdnt/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-9',
        wordId: 'w-9',
        pos: 'n.',
        definitionCn: '学生；学者',
        definitionEn: 'a person who is studying at a school or college',
        exampleEn: 'Every student in the class passed the exam.',
        exampleCn: '班里每个学生都通过了考试。'
      }
    ],
    phonics: [
      { id: 'wp-9-1', wordId: 'w-9', sequence: 1, text: 'stu', phonetic: '/stjuː/', syllable: 'stu' },
      { id: 'wp-9-2', wordId: 'w-9', sequence: 2, text: 'dent', phonetic: '/dnt/', syllable: 'dent' }
    ]
  },
  {
    id: 'w-10',
    text: 'family',
    phoneticUk: '/ˈfæməli/',
    phoneticUs: '/ˈfæməli/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-10',
        wordId: 'w-10',
        pos: 'n.',
        definitionCn: '家庭；家人',
        definitionEn: 'a group of one or more parents and their children living together',
        exampleEn: 'Family dinner is our weekend tradition.',
        exampleCn: '全家共进晚餐是我们的周末传统。'
      }
    ],
    phonics: [
      { id: 'wp-10-1', wordId: 'w-10', sequence: 1, text: 'fam', phonetic: '/fæm/', syllable: 'fam' },
      { id: 'wp-10-2', wordId: 'w-10', sequence: 2, text: 'i', phonetic: '/ə/', syllable: 'i' },
      { id: 'wp-10-3', wordId: 'w-10', sequence: 3, text: 'ly', phonetic: '/li/', syllable: 'ly' }
    ]
  },
  {
    id: 'w-11',
    text: 'friend',
    phoneticUk: '/frend/',
    phoneticUs: '/frend/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-11',
        wordId: 'w-11',
        pos: 'n.',
        definitionCn: '朋友；同伴',
        definitionEn: 'a person whom one knows and with whom one has a bond of mutual affection',
        exampleEn: 'A true friend is always by your side.',
        exampleCn: '真正的朋友总是在你身边。'
      }
    ],
    phonics: [
      { id: 'wp-11-1', wordId: 'w-11', sequence: 1, text: 'fr', phonetic: '/fr/', syllable: 'fr' },
      { id: 'wp-11-2', wordId: 'w-11', sequence: 2, text: 'iend', phonetic: '/end/', syllable: 'iend' }
    ]
  },
  {
    id: 'w-12',
    text: 'morning',
    phoneticUk: '/ˈmɔːnɪŋ/',
    phoneticUs: '/ˈmɔːrnɪŋ/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-12',
        wordId: 'w-12',
        pos: 'n.',
        definitionCn: '早晨；上午',
        definitionEn: 'the period of time between sunrise and noon',
        exampleEn: 'I like reading English in the early morning.',
        exampleCn: '我喜欢在清晨读英语。'
      }
    ],
    phonics: [
      { id: 'wp-12-1', wordId: 'w-12', sequence: 1, text: 'morn', phonetic: '/mɔːrn/', syllable: 'morn' },
      { id: 'wp-12-2', wordId: 'w-12', sequence: 2, text: 'ing', phonetic: '/ɪŋ/', syllable: 'ing' }
    ]
  },
  {
    id: 'w-13',
    text: 'afternoon',
    phoneticUk: '/ˌɑːftəˈnuːn/',
    phoneticUs: '/ˌæftərˈnuːn/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-13',
        wordId: 'w-13',
        pos: 'n.',
        definitionCn: '下午；午后',
        definitionEn: 'the time between midday and the evening',
        exampleEn: 'Let us have a cup of tea this afternoon.',
        exampleCn: '今天下午我们喝杯茶吧。'
      }
    ],
    phonics: [
      { id: 'wp-13-1', wordId: 'w-13', sequence: 1, text: 'af', phonetic: '/æf/', syllable: 'af' },
      { id: 'wp-13-2', wordId: 'w-13', sequence: 2, text: 'ter', phonetic: '/tər/', syllable: 'ter' },
      { id: 'wp-13-3', wordId: 'w-13', sequence: 3, text: 'noon', phonetic: '/nuːn/', syllable: 'noon' }
    ]
  },
  {
    id: 'w-14',
    text: 'evening',
    phoneticUk: '/ˈiːvnɪŋ/',
    phoneticUs: '/ˈiːvnɪŋ/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-14',
        wordId: 'w-14',
        pos: 'n.',
        definitionCn: '傍晚；晚上',
        definitionEn: 'the period of time at the end of the day',
        exampleEn: 'We took a quiet walk in the evening.',
        exampleCn: '我们在傍晚安静地散了步。'
      }
    ],
    phonics: [
      { id: 'wp-14-1', wordId: 'w-14', sequence: 1, text: 'eve', phonetic: '/iːv/', syllable: 'eve' },
      { id: 'wp-14-2', wordId: 'w-14', sequence: 2, text: 'ning', phonetic: '/nɪŋ/', syllable: 'ning' }
    ]
  },
  {
    id: 'w-15',
    text: 'summer',
    phoneticUk: '/ˈsʌmə(r)/',
    phoneticUs: '/ˈsʌmər/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-15',
        wordId: 'w-15',
        pos: 'n.',
        definitionCn: '夏天；夏季',
        definitionEn: 'the warmest season of the year',
        exampleEn: 'Summer is the best season for swimming.',
        exampleCn: '夏天是游泳的最佳季节。'
      }
    ],
    phonics: [
      { id: 'wp-15-1', wordId: 'w-15', sequence: 1, text: 'sum', phonetic: '/sʌm/', syllable: 'sum' },
      { id: 'wp-15-2', wordId: 'w-15', sequence: 2, text: 'mer', phonetic: '/ər/', syllable: 'mer' }
    ]
  },
  {
    id: 'w-16',
    text: 'winter',
    phoneticUk: '/ˈwɪntə(r)/',
    phoneticUs: '/ˈwɪntər/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-16',
        wordId: 'w-16',
        pos: 'n.',
        definitionCn: '冬天；冬季',
        definitionEn: 'the coldest season of the year',
        exampleEn: 'Snow covered the mountain in winter.',
        exampleCn: '冬天的积雪覆盖了山峰。'
      }
    ],
    phonics: [
      { id: 'wp-16-1', wordId: 'w-16', sequence: 1, text: 'win', phonetic: '/wɪn/', syllable: 'win' },
      { id: 'wp-16-2', wordId: 'w-16', sequence: 2, text: 'ter', phonetic: '/tər/', syllable: 'ter' }
    ]
  },
  {
    id: 'w-17',
    text: 'travel',
    phoneticUk: '/ˈtrævl/',
    phoneticUs: '/ˈtrævl/',
    pos: 'v./n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-17',
        wordId: 'w-17',
        pos: 'v.',
        definitionCn: '旅行；出游',
        definitionEn: 'make a journey, typically of some length',
        exampleEn: 'I love to travel to different countries.',
        exampleCn: '我喜欢去不同的国家旅行。'
      }
    ],
    phonics: [
      { id: 'wp-17-1', wordId: 'w-17', sequence: 1, text: 'tra', phonetic: '/træ/', syllable: 'tra' },
      { id: 'wp-17-2', wordId: 'w-17', sequence: 2, text: 'vel', phonetic: '/vl/', syllable: 'vel' }
    ]
  },
  {
    id: 'w-18',
    text: 'country',
    phoneticUk: '/ˈkʌntri/',
    phoneticUs: '/ˈkʌntri/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-18',
        wordId: 'w-18',
        pos: 'n.',
        definitionCn: '国家；乡村',
        definitionEn: 'a nation with its own government, occupying a particular territory',
        exampleEn: 'China is a country with rich history.',
        exampleCn: '中国是一个历史悠久的国家。'
      }
    ],
    phonics: [
      { id: 'wp-18-1', wordId: 'w-18', sequence: 1, text: 'coun', phonetic: '/kʌn/', syllable: 'coun' },
      { id: 'wp-18-2', wordId: 'w-18', sequence: 2, text: 'try', phonetic: '/tri/', syllable: 'try' }
    ]
  },
  {
    id: 'w-19',
    text: 'city',
    phoneticUk: '/ˈsɪti/',
    phoneticUs: '/ˈsɪt̬i/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-19',
        wordId: 'w-19',
        pos: 'n.',
        definitionCn: '城市；都市',
        definitionEn: 'a large town',
        exampleEn: 'Shanghai is a bustling modern city.',
        exampleCn: '上海是一座繁华的现代大都市。'
      }
    ],
    phonics: [
      { id: 'wp-19-1', wordId: 'w-19', sequence: 1, text: 'ci', phonetic: '/sɪ/', syllable: 'ci' },
      { id: 'wp-19-2', wordId: 'w-19', sequence: 2, text: 'ty', phonetic: '/ti/', syllable: 'ty' }
    ]
  },
  {
    id: 'w-20',
    text: 'question',
    phoneticUk: '/ˈkwestʃən/',
    phoneticUs: '/ˈkwestʃən/',
    pos: 'n./v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-20',
        wordId: 'w-20',
        pos: 'n.',
        definitionCn: '问题；疑问',
        definitionEn: 'a sentence worded or expressed so as to elicit information',
        exampleEn: 'Please raise your hand if you have a question.',
        exampleCn: '如果你有问题，请举手。'
      }
    ],
    phonics: [
      { id: 'wp-20-1', wordId: 'w-20', sequence: 1, text: 'ques', phonetic: '/kwes/', syllable: 'ques' },
      { id: 'wp-20-2', wordId: 'w-20', sequence: 2, text: 'tion', phonetic: '/tʃən/', syllable: 'tion' }
    ]
  },
  {
    id: 'w-21',
    text: 'weather',
    phoneticUk: '/ˈweðə(r)/',
    phoneticUs: '/ˈweðər/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-21',
        wordId: 'w-21',
        pos: 'n.',
        definitionCn: '天气；气候',
        definitionEn: 'the state of the atmosphere at a place and time',
        exampleEn: 'The weather is warm and sunny today.',
        exampleCn: '今天天气温暖晴朗。'
      }
    ],
    phonics: [
      { id: 'wp-21-1', wordId: 'w-21', sequence: 1, text: 'weath', phonetic: '/weð/', syllable: 'weath' },
      { id: 'wp-21-2', wordId: 'w-21', sequence: 2, text: 'er', phonetic: '/ər/', syllable: 'er' }
    ]
  },
  {
    id: 'w-22',
    text: 'practice',
    phoneticUk: '/ˈpræktɪs/',
    phoneticUs: '/ˈpræktɪs/',
    pos: 'n./v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-22',
        wordId: 'w-22',
        pos: 'v.',
        definitionCn: '练习；实习',
        definitionEn: 'perform an activity repeatedly to improve skill',
        exampleEn: 'Practice makes perfect.',
        exampleCn: '熟能生巧。'
      }
    ],
    phonics: [
      { id: 'wp-22-1', wordId: 'w-22', sequence: 1, text: 'prac', phonetic: '/præk/', syllable: 'prac' },
      { id: 'wp-22-2', wordId: 'w-22', sequence: 2, text: 'tice', phonetic: '/tɪs/', syllable: 'tice' }
    ]
  },
  {
    id: 'w-23',
    text: 'language',
    phoneticUk: '/ˈlæŋɡwɪdʒ/',
    phoneticUs: '/ˈlæŋɡwɪdʒ/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-23',
        wordId: 'w-23',
        pos: 'n.',
        definitionCn: '语言；文字',
        definitionEn: 'the method of human communication using words',
        exampleEn: 'English is an international language.',
        exampleCn: '英语是一门国际语言。'
      }
    ],
    phonics: [
      { id: 'wp-23-1', wordId: 'w-23', sequence: 1, text: 'lan', phonetic: '/læŋ/', syllable: 'lan' },
      { id: 'wp-23-2', wordId: 'w-23', sequence: 2, text: 'guage', phonetic: '/ɡwɪdʒ/', syllable: 'guage' }
    ]
  },
  {
    id: 'w-24',
    text: 'knowledge',
    phoneticUk: '/ˈnɒlɪdʒ/',
    phoneticUs: '/ˈnɑːlɪdʒ/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-24',
        wordId: 'w-24',
        pos: 'n.',
        definitionCn: '知识；学问',
        definitionEn: 'facts, information, and skills acquired through experience or education',
        exampleEn: 'Knowledge is power.',
        exampleCn: '知识就是力量。'
      }
    ],
    phonics: [
      { id: 'wp-24-1', wordId: 'w-24', sequence: 1, text: 'know', phonetic: '/nɒ/', syllable: 'know' },
      { id: 'wp-24-2', wordId: 'w-24', sequence: 2, text: 'ledge', phonetic: '/lɪdʒ/', syllable: 'ledge' }
    ]
  },
  {
    id: 'w-25',
    text: 'library',
    phoneticUk: '/ˈlaɪbrəri/',
    phoneticUs: '/ˈlaɪbreri/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-25',
        wordId: 'w-25',
        pos: 'n.',
        definitionCn: '图书馆；藏书室',
        definitionEn: 'a building or room containing collections of books for reading',
        exampleEn: 'I borrow books from the school library.',
        exampleCn: '我从学校图书馆借书。'
      }
    ],
    phonics: [
      { id: 'wp-25-1', wordId: 'w-25', sequence: 1, text: 'li', phonetic: '/laɪ/', syllable: 'li' },
      { id: 'wp-25-2', wordId: 'w-25', sequence: 2, text: 'bra', phonetic: '/brə/', syllable: 'bra' },
      { id: 'wp-25-3', wordId: 'w-25', sequence: 3, text: 'ry', phonetic: '/ri/', syllable: 'ry' }
    ]
  },
  {
    id: 'w-26',
    text: 'progress',
    phoneticUk: '/ˈprəʊɡres/',
    phoneticUs: '/ˈprɑːɡres/',
    pos: 'n./v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-26',
        wordId: 'w-26',
        pos: 'n.',
        definitionCn: '进步；进展',
        definitionEn: 'forward or onward movement toward a destination or goal',
        exampleEn: 'You are making steady progress in English.',
        exampleCn: '你的英语正在取得稳步进展。'
      }
    ],
    phonics: [
      { id: 'wp-26-1', wordId: 'w-26', sequence: 1, text: 'pro', phonetic: '/prəʊ/', syllable: 'pro' },
      { id: 'wp-26-2', wordId: 'w-26', sequence: 2, text: 'gress', phonetic: '/ɡres/', syllable: 'gress' }
    ]
  },
  {
    id: 'w-27',
    text: 'memory',
    phoneticUk: '/ˈmeməri/',
    phoneticUs: '/ˈmeməri/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-27',
        wordId: 'w-27',
        pos: 'n.',
        definitionCn: '记忆；记忆力；回忆',
        definitionEn: 'the faculty by which the mind stores and remembers information',
        exampleEn: 'Spaced repetition boosts memory retention.',
        exampleCn: '间隔重复能显著提升记忆保留率。'
      }
    ],
    phonics: [
      { id: 'wp-27-1', wordId: 'w-27', sequence: 1, text: 'mem', phonetic: '/mem/', syllable: 'mem' },
      { id: 'wp-27-2', wordId: 'w-27', sequence: 2, text: 'o', phonetic: '/ə/', syllable: 'o' },
      { id: 'wp-27-3', wordId: 'w-27', sequence: 3, text: 'ry', phonetic: '/ri/', syllable: 'ry' }
    ]
  },
  {
    id: 'w-28',
    text: 'sentence',
    phoneticUk: '/ˈsentəns/',
    phoneticUs: '/ˈsentəns/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-28',
        wordId: 'w-28',
        pos: 'n.',
        definitionCn: '句子；判决',
        definitionEn: 'a set of words that is complete in itself, typically containing a subject and predicate',
        exampleEn: 'Write down a complete English sentence.',
        exampleCn: '写下一个完整的英语句子。'
      }
    ],
    phonics: [
      { id: 'wp-28-1', wordId: 'w-28', sequence: 1, text: 'sen', phonetic: '/sen/', syllable: 'sen' },
      { id: 'wp-28-2', wordId: 'w-28', sequence: 2, text: 'tence', phonetic: '/təns/', syllable: 'tence' }
    ]
  },
  {
    id: 'w-29',
    text: 'dictionary',
    phoneticUk: '/ˈdɪkʃənri/',
    phoneticUs: '/ˈdɪkʃəneri/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-29',
        wordId: 'w-29',
        pos: 'n.',
        definitionCn: '字典；词典',
        definitionEn: 'a book or electronic resource that lists words and their meanings',
        exampleEn: 'Look up unknown words in the dictionary.',
        exampleCn: '在词典中查生词。'
      }
    ],
    phonics: [
      { id: 'wp-29-1', wordId: 'w-29', sequence: 1, text: 'dic', phonetic: '/dɪk/', syllable: 'dic' },
      { id: 'wp-29-2', wordId: 'w-29', sequence: 2, text: 'tion', phonetic: '/ʃən/', syllable: 'tion' },
      { id: 'wp-29-3', wordId: 'w-29', sequence: 3, text: 'ar', phonetic: '/e/', syllable: 'ar' },
      { id: 'wp-29-4', wordId: 'w-29', sequence: 4, text: 'y', phonetic: '/ri/', syllable: 'y' }
    ]
  },
  {
    id: 'w-30',
    text: 'exercise',
    phoneticUk: '/ˈeksəsaɪz/',
    phoneticUs: '/ˈeksərsaɪz/',
    pos: 'n./v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-30',
        wordId: 'w-30',
        pos: 'n.',
        definitionCn: '锻炼；习题',
        definitionEn: 'activity requiring physical or mental effort',
        exampleEn: 'Regular exercise keeps your body fit.',
        exampleCn: '定期锻炼能保持身体健康。'
      }
    ],
    phonics: [
      { id: 'wp-30-1', wordId: 'w-30', sequence: 1, text: 'ex', phonetic: '/ek/', syllable: 'ex' },
      { id: 'wp-30-2', wordId: 'w-30', sequence: 2, text: 'er', phonetic: '/sər/', syllable: 'er' },
      { id: 'wp-30-3', wordId: 'w-30', sequence: 3, text: 'cise', phonetic: '/saɪz/', syllable: 'cise' }
    ]
  },
  {
    id: 'w-31',
    text: 'listen',
    phoneticUk: '/ˈlɪsn/',
    phoneticUs: '/ˈlɪsn/',
    pos: 'v.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-31',
        wordId: 'w-31',
        pos: 'v.',
        definitionCn: '听；倾听',
        definitionEn: 'give one’s attention to a sound',
        exampleEn: 'Listen carefully to the teacher’s pronunciation.',
        exampleCn: '仔细听老师的发音。'
      }
    ],
    phonics: [
      { id: 'wp-31-1', wordId: 'w-31', sequence: 1, text: 'lis', phonetic: '/lɪ/', syllable: 'lis' },
      { id: 'wp-31-2', wordId: 'w-31', sequence: 2, text: 'ten', phonetic: '/sn/', syllable: 'ten' }
    ]
  },
  {
    id: 'w-32',
    text: 'speak',
    phoneticUk: '/spiːk/',
    phoneticUs: '/spiːk/',
    pos: 'v.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-32',
        wordId: 'w-32',
        pos: 'v.',
        definitionCn: '讲；谈话；演说',
        definitionEn: 'say something in order to convey information or an opinion',
        exampleEn: 'Can you speak English fluently?',
        exampleCn: '你能流利说英语吗？'
      }
    ],
    phonics: [
      { id: 'wp-32-1', wordId: 'w-32', sequence: 1, text: 'sp', phonetic: '/sp/', syllable: 'sp' },
      { id: 'wp-32-2', wordId: 'w-32', sequence: 2, text: 'eak', phonetic: '/iːk/', syllable: 'eak' }
    ]
  },
  {
    id: 'w-33',
    text: 'read',
    phoneticUk: '/riːd/',
    phoneticUs: '/riːd/',
    pos: 'v.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-33',
        wordId: 'w-33',
        pos: 'v.',
        definitionCn: '读；阅读',
        definitionEn: 'look at and comprehend the meaning of written matter',
        exampleEn: 'I read an English chapter every night.',
        exampleCn: '我每晚读一章英语。'
      }
    ],
    phonics: [
      { id: 'wp-33-1', wordId: 'w-33', sequence: 1, text: 'r', phonetic: '/r/', syllable: 'r' },
      { id: 'wp-33-2', wordId: 'w-33', sequence: 2, text: 'ead', phonetic: '/iːd/', syllable: 'ead' }
    ]
  },
  {
    id: 'w-34',
    text: 'write',
    phoneticUk: '/raɪt/',
    phoneticUs: '/raɪt/',
    pos: 'v.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-34',
        wordId: 'w-34',
        pos: 'v.',
        definitionCn: '写；书写；写作',
        definitionEn: 'mark on a surface with a pen, pencil, or other instrument',
        exampleEn: 'Write your thoughts in an English journal.',
        exampleCn: '把你的想法写在英语日记里。'
      }
    ],
    phonics: [
      { id: 'wp-34-1', wordId: 'w-34', sequence: 1, text: 'wr', phonetic: '/r/', syllable: 'wr' },
      { id: 'wp-34-2', wordId: 'w-34', sequence: 2, text: 'ite', phonetic: '/aɪt/', syllable: 'ite' }
    ]
  },
  {
    id: 'w-35',
    text: 'learn',
    phoneticUk: '/lɜːn/',
    phoneticUs: '/lɜːrn/',
    pos: 'v.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-35',
        wordId: 'w-35',
        pos: 'v.',
        definitionCn: '学习；学会',
        definitionEn: 'gain knowledge of or skill in something',
        exampleEn: 'It is never too late to learn.',
        exampleCn: '活到老，学到老。'
      }
    ],
    phonics: [
      { id: 'wp-35-1', wordId: 'w-35', sequence: 1, text: 'l', phonetic: '/l/', syllable: 'l' },
      { id: 'wp-35-2', wordId: 'w-35', sequence: 2, text: 'earn', phonetic: '/ɜːn/', syllable: 'earn' }
    ]
  },
  {
    id: 'w-36',
    text: 'review',
    phoneticUk: '/rɪˈvjuː/',
    phoneticUs: '/rɪˈvjuː/',
    pos: 'v./n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-36',
        wordId: 'w-36',
        pos: 'v.',
        definitionCn: '复习；回顾；审阅',
        definitionEn: 'view or inspect again; examine',
        exampleEn: 'Review the new words before going to sleep.',
        exampleCn: '睡前复习一下生词。'
      }
    ],
    phonics: [
      { id: 'wp-36-1', wordId: 'w-36', sequence: 1, text: 're', phonetic: '/rɪ/', syllable: 're' },
      { id: 'wp-36-2', wordId: 'w-36', sequence: 2, text: 'view', phonetic: '/vjuː/', syllable: 'view' }
    ]
  },
  {
    id: 'w-37',
    text: 'master',
    phoneticUk: '/ˈmɑːstə(r)/',
    phoneticUs: '/ˈmæstər/',
    pos: 'v./n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-37',
        wordId: 'w-37',
        pos: 'v.',
        definitionCn: '精通；掌握；主人',
        definitionEn: 'acquire complete knowledge or skill in',
        exampleEn: 'You can master 500 core words this month.',
        exampleCn: '你本月可以掌握500个核心词。'
      }
    ],
    phonics: [
      { id: 'wp-37-1', wordId: 'w-37', sequence: 1, text: 'mas', phonetic: '/mæs/', syllable: 'mas' },
      { id: 'wp-37-2', wordId: 'w-37', sequence: 2, text: 'ter', phonetic: '/tər/', syllable: 'ter' }
    ]
  },
  {
    id: 'w-38',
    text: 'achieve',
    phoneticUk: '/əˈtʃiːv/',
    phoneticUs: '/əˈtʃiːv/',
    pos: 'v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-38',
        wordId: 'w-38',
        pos: 'v.',
        definitionCn: '达成；取得；实现',
        definitionEn: 'successfully bring about or reach by effort',
        exampleEn: 'Work hard and you will achieve your dreams.',
        exampleCn: '努力工作，你就能实现梦想。'
      }
    ],
    phonics: [
      { id: 'wp-38-1', wordId: 'w-38', sequence: 1, text: 'a', phonetic: '/ə/', syllable: 'a' },
      { id: 'wp-38-2', wordId: 'w-38', sequence: 2, text: 'chieve', phonetic: '/tʃiːv/', syllable: 'chieve' }
    ]
  },
  {
    id: 'w-39',
    text: 'success',
    phoneticUk: '/səkˈses/',
    phoneticUs: '/səkˈses/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-39',
        wordId: 'w-39',
        pos: 'n.',
        definitionCn: '成功；胜利',
        definitionEn: 'the accomplishment of an aim or purpose',
        exampleEn: 'Persistence is key to learning success.',
        exampleCn: '坚持是学习成功的关键。'
      }
    ],
    phonics: [
      { id: 'wp-39-1', wordId: 'w-39', sequence: 1, text: 'suc', phonetic: '/sək/', syllable: 'suc' },
      { id: 'wp-39-2', wordId: 'w-39', sequence: 2, text: 'cess', phonetic: '/ses/', syllable: 'cess' }
    ]
  },
  {
    id: 'w-40',
    text: 'effort',
    phoneticUk: '/ˈefət/',
    phoneticUs: '/ˈefərt/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-40',
        wordId: 'w-40',
        pos: 'n.',
        definitionCn: '努力；尽力',
        definitionEn: 'a vigorous or determined attempt',
        exampleEn: 'Every small effort counts toward your goal.',
        exampleCn: '每一次微小的努力都会助你达成目标。'
      }
    ],
    phonics: [
      { id: 'wp-40-1', wordId: 'w-40', sequence: 1, text: 'ef', phonetic: '/ef/', syllable: 'ef' },
      { id: 'wp-40-2', wordId: 'w-40', sequence: 2, text: 'fort', phonetic: '/ərt/', syllable: 'fort' }
    ]
  },
  {
    id: 'w-41',
    text: 'challenge',
    phoneticUk: '/ˈtʃælɪndʒ/',
    phoneticUs: '/ˈtʃælɪndʒ/',
    pos: 'n./v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-41',
        wordId: 'w-41',
        pos: 'n.',
        definitionCn: '挑战；艰巨任务',
        definitionEn: 'a call to take part in a contest or fight; difficult task',
        exampleEn: 'Accept the challenge with confidence.',
        exampleCn: '自信地迎接挑战。'
      }
    ],
    phonics: [
      { id: 'wp-41-1', wordId: 'w-41', sequence: 1, text: 'chal', phonetic: '/tʃæl/', syllable: 'chal' },
      { id: 'wp-41-2', wordId: 'w-41', sequence: 2, text: 'lenge', phonetic: '/ɪndʒ/', syllable: 'lenge' }
    ]
  },
  {
    id: 'w-42',
    text: 'explore',
    phoneticUk: '/ɪkˈsplɔː(r)/',
    phoneticUs: '/ɪkˈsplɔːr/',
    pos: 'v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-42',
        wordId: 'w-42',
        pos: 'v.',
        definitionCn: '探索；探究；勘查',
        definitionEn: 'travel in or through in order to learn about it',
        exampleEn: 'Let us explore new ways of learning English.',
        exampleCn: '让我们探索学习英语的新方法。'
      }
    ],
    phonics: [
      { id: 'wp-42-1', wordId: 'w-42', sequence: 1, text: 'ex', phonetic: '/ɪk/', syllable: 'ex' },
      { id: 'wp-42-2', wordId: 'w-42', sequence: 2, text: 'plore', phonetic: '/splɔːr/', syllable: 'plore' }
    ]
  },
  {
    id: 'w-43',
    text: 'discover',
    phoneticUk: '/dɪˈskʌvə(r)/',
    phoneticUs: '/dɪˈskʌvər/',
    pos: 'v.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-43',
        wordId: 'w-43',
        pos: 'v.',
        definitionCn: '发现；发觉',
        definitionEn: 'find unexpectedly or in the course of a search',
        exampleEn: 'You will discover many interesting phrases here.',
        exampleCn: '你会在这里发现很多有趣的短语。'
      }
    ],
    phonics: [
      { id: 'wp-43-1', wordId: 'w-43', sequence: 1, text: 'dis', phonetic: '/dɪs/', syllable: 'dis' },
      { id: 'wp-43-2', wordId: 'w-43', sequence: 2, text: 'cov', phonetic: '/kʌv/', syllable: 'cov' },
      { id: 'wp-43-3', wordId: 'w-43', sequence: 3, text: 'er', phonetic: '/ər/', syllable: 'er' }
    ]
  },
  {
    id: 'w-44',
    text: 'wonder',
    phoneticUk: '/ˈwʌndə(r)/',
    phoneticUs: '/ˈwʌndər/',
    pos: 'v./n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-44',
        wordId: 'w-44',
        pos: 'v.',
        definitionCn: '感到好奇；想知道；奇迹',
        definitionEn: 'desire or be curious to know something',
        exampleEn: 'I wonder what happens next in the story.',
        exampleCn: '我想知道故事接下去会发生什么。'
      }
    ],
    phonics: [
      { id: 'wp-44-1', wordId: 'w-44', sequence: 1, text: 'won', phonetic: '/wʌn/', syllable: 'won' },
      { id: 'wp-44-2', wordId: 'w-44', sequence: 2, text: 'der', phonetic: '/dər/', syllable: 'der' }
    ]
  },
  {
    id: 'w-45',
    text: 'simple',
    phoneticUk: '/ˈsɪmpl/',
    phoneticUs: '/ˈsɪmpl/',
    pos: 'adj.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-45',
        wordId: 'w-45',
        pos: 'adj.',
        definitionCn: '简单的；单纯的',
        definitionEn: 'easily understood or done; presenting no difficulty',
        exampleEn: 'Keep your sentences simple and clear.',
        exampleCn: '保持句子简单清晰。'
      }
    ],
    phonics: [
      { id: 'wp-45-1', wordId: 'w-45', sequence: 1, text: 'sim', phonetic: '/sɪm/', syllable: 'sim' },
      { id: 'wp-45-2', wordId: 'w-45', sequence: 2, text: 'ple', phonetic: '/pl/', syllable: 'ple' }
    ]
  },
  {
    id: 'w-46',
    text: 'future',
    phoneticUk: '/ˈfjuːtʃə(r)/',
    phoneticUs: '/ˈfjuːtʃər/',
    pos: 'n./adj.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-46',
        wordId: 'w-46',
        pos: 'n.',
        definitionCn: '未来；前途',
        definitionEn: 'the time that will come after the present',
        exampleEn: 'Invest in your future by learning today.',
        exampleCn: '通过今天的学习投资你的未来。'
      }
    ],
    phonics: [
      { id: 'wp-46-1', wordId: 'w-46', sequence: 1, text: 'fu', phonetic: '/fjuː/', syllable: 'fu' },
      { id: 'wp-46-2', wordId: 'w-46', sequence: 2, text: 'ture', phonetic: '/tʃər/', syllable: 'ture' }
    ]
  },
  {
    id: 'w-47',
    text: 'spring',
    phoneticUk: '/sprɪŋ/',
    phoneticUs: '/sprɪŋ/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-47',
        wordId: 'w-47',
        pos: 'n.',
        definitionCn: '春天；春季；泉水',
        definitionEn: 'the season after winter and before summer',
        exampleEn: 'Flowers begin to bloom in early spring.',
        exampleCn: '早春时节鲜花盛开。'
      }
    ],
    phonics: [
      { id: 'wp-47-1', wordId: 'w-47', sequence: 1, text: 'spr', phonetic: '/spr/', syllable: 'spr' },
      { id: 'wp-47-2', wordId: 'w-47', sequence: 2, text: 'ing', phonetic: '/ɪŋ/', syllable: 'ing' }
    ]
  },
  {
    id: 'w-48',
    text: 'autumn',
    phoneticUk: '/ˈɔːtəm/',
    phoneticUs: '/ˈɑːtəm/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-48',
        wordId: 'w-48',
        pos: 'n.',
        definitionCn: '秋天；秋季',
        definitionEn: 'the season between summer and winter',
        exampleEn: 'Golden leaves fall gently in autumn.',
        exampleCn: '秋天金黄的树叶轻轻飘落。'
      }
    ],
    phonics: [
      { id: 'wp-48-1', wordId: 'w-48', sequence: 1, text: 'au', phonetic: '/ɔː/', syllable: 'au' },
      { id: 'wp-48-2', wordId: 'w-48', sequence: 2, text: 'tumn', phonetic: '/təm/', syllable: 'tumn' }
    ]
  },
  {
    id: 'w-49',
    text: 'journey',
    phoneticUk: '/ˈdʒɜːni/',
    phoneticUs: '/ˈdʒɜːrni/',
    pos: 'n.',
    difficulty: 2,
    meanings: [
      {
        id: 'wm-49',
        wordId: 'w-49',
        pos: 'n.',
        definitionCn: '旅程；旅行；历程',
        definitionEn: 'an act of traveling from one place to another',
        exampleEn: 'A journey of a thousand miles begins with a single step.',
        exampleCn: '千里之行，始于足下。'
      }
    ],
    phonics: [
      { id: 'wp-49-1', wordId: 'w-49', sequence: 1, text: 'jour', phonetic: '/dʒɜːr/', syllable: 'jour' },
      { id: 'wp-49-2', wordId: 'w-49', sequence: 2, text: 'ney', phonetic: '/ni/', syllable: 'ney' }
    ]
  },
  {
    id: 'w-50',
    text: 'season',
    phoneticUk: '/ˈsiːzn/',
    phoneticUs: '/ˈsiːzn/',
    pos: 'n.',
    difficulty: 1,
    meanings: [
      {
        id: 'wm-50',
        wordId: 'w-50',
        pos: 'n.',
        definitionCn: '季节；节期',
        definitionEn: 'each of the four divisions of the year',
        exampleEn: 'Which season do you like best?',
        exampleCn: '你最喜欢哪个季节？'
      }
    ],
    phonics: [
      { id: 'wp-50-1', wordId: 'w-50', sequence: 1, text: 'sea', phonetic: '/siː/', syllable: 'sea' },
      { id: 'wp-50-2', wordId: 'w-50', sequence: 2, text: 'son', phonetic: '/zn/', syllable: 'son' }
    ]
  }
];

export const SEED_SENTENCES: Sentence[] = [
  {
    id: 's-1',
    content: 'Where did you go during the holiday?',
    translation: '你在假期去了哪里？',
    level: 'A1',
    difficulty: 1,
    steps: [
      {
        id: 'ss-1-1',
        sentenceId: 's-1',
        stepNumber: 1,
        content: 'Where',
        translation: '哪里',
        phonetic: '/weə(r)/',
        type: 'WORD'
      },
      {
        id: 'ss-1-2',
        sentenceId: 's-1',
        stepNumber: 2,
        content: 'Where did',
        translation: '你在哪里（助动词引导疑问）',
        phonetic: '/wer dɪd/',
        type: 'STRUCTURE'
      },
      {
        id: 'ss-1-3',
        sentenceId: 's-1',
        stepNumber: 3,
        content: 'Where did you',
        translation: '你在哪里（询问对象）',
        phonetic: '/wer dɪd juː/',
        type: 'STRUCTURE'
      },
      {
        id: 'ss-1-4',
        sentenceId: 's-1',
        stepNumber: 4,
        content: 'Where did you go',
        translation: '你去了哪里',
        phonetic: '/wer dɪd juː ɡəʊ/',
        type: 'PHRASE'
      },
      {
        id: 'ss-1-5',
        sentenceId: 's-1',
        stepNumber: 5,
        content: 'during the holiday',
        translation: '在假期期间',
        phonetic: '/ˈdjʊərɪŋ ðə ˈhɒlədeɪ/',
        type: 'PHRASE'
      },
      {
        id: 'ss-1-6',
        sentenceId: 's-1',
        stepNumber: 6,
        content: 'Where did you go during the holiday?',
        translation: '你在假期去了哪里？',
        phonetic: '/wer dɪd juː ɡəʊ ˈdjʊərɪŋ ðə ˈhɒlədeɪ/',
        type: 'SENTENCE'
      }
    ],
    analyses: [
      { id: 'sa-1-1', sentenceId: 's-1', text: 'Where', startPosition: 0, endPosition: 5, type: '疑问词', explanation: '特殊疑问代词，询问具体地点' },
      { id: 'sa-1-2', sentenceId: 's-1', text: 'did', startPosition: 6, endPosition: 9, type: '助动词', explanation: '一般过去时助动词，协助构成疑问句' },
      { id: 'sa-1-3', sentenceId: 's-1', text: 'you', startPosition: 10, endPosition: 13, type: '主语', explanation: '第二人称代词，动作的执行者' },
      { id: 'sa-1-4', sentenceId: 's-1', text: 'go', startPosition: 14, endPosition: 16, type: '动词原形', explanation: '主要谓语动词，因有 did 助动词故使用原形' },
      { id: 'sa-1-5', sentenceId: 's-1', text: 'during the holiday', startPosition: 17, endPosition: 35, type: '时间状语', explanation: '介词短语修饰整句，交代动作发生的时间段' }
    ]
  },
  {
    id: 's-2',
    content: 'I went to Beijing during the holiday.',
    translation: '我在假期去了北京。',
    level: 'A1',
    difficulty: 1,
    steps: [
      { id: 'ss-2-1', sentenceId: 's-2', stepNumber: 1, content: 'I went', translation: '我去了', phonetic: '/aɪ went/', type: 'WORD' },
      { id: 'ss-2-2', sentenceId: 's-2', stepNumber: 2, content: 'I went to Beijing', translation: '我去了北京', phonetic: '/aɪ went tuː beɪˈdʒɪŋ/', type: 'PHRASE' },
      { id: 'ss-2-3', sentenceId: 's-2', stepNumber: 3, content: 'during the holiday', translation: '在假期期间', phonetic: '/ˈdjʊərɪŋ ðə ˈhɒlədeɪ/', type: 'PHRASE' },
      { id: 'ss-2-4', sentenceId: 's-2', stepNumber: 4, content: 'I went to Beijing during the holiday.', translation: '我在假期去了北京。', phonetic: '/aɪ went tuː beɪˈdʒɪŋ ˈdjʊərɪŋ ðə ˈhɒlədeɪ/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-2-1', sentenceId: 's-2', text: 'I', startPosition: 0, endPosition: 1, type: '主语', explanation: '第一人称代词' },
      { id: 'sa-2-2', sentenceId: 's-2', text: 'went', startPosition: 2, endPosition: 6, type: '谓语动词', explanation: 'go 的过去式' },
      { id: 'sa-2-3', sentenceId: 's-2', text: 'to Beijing', startPosition: 7, endPosition: 17, type: '地点状语', explanation: '表示去向的目的地' },
      { id: 'sa-2-4', sentenceId: 's-2', text: 'during the holiday', startPosition: 18, endPosition: 36, type: '时间状语', explanation: '说明假期的时间环境' }
    ]
  },
  {
    id: 's-3',
    content: 'What did you do yesterday?',
    translation: '你昨天做了什么？',
    level: 'A1',
    difficulty: 1,
    steps: [
      { id: 'ss-3-1', sentenceId: 's-3', stepNumber: 1, content: 'What', translation: '什么', phonetic: '/wɒt/', type: 'WORD' },
      { id: 'ss-3-2', sentenceId: 's-3', stepNumber: 2, content: 'What did you', translation: '你做了什么（疑问骨架）', phonetic: '/wɒt dɪd juː/', type: 'STRUCTURE' },
      { id: 'ss-3-3', sentenceId: 's-3', stepNumber: 3, content: 'What did you do', translation: '你做了什么', phonetic: '/wɒt dɪd juː duː/', type: 'PHRASE' },
      { id: 'ss-3-4', sentenceId: 's-3', stepNumber: 4, content: 'What did you do yesterday?', translation: '你昨天做了什么？', phonetic: '/wɒt dɪd juː duː ˈjestədeɪ/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-3-1', sentenceId: 's-3', text: 'What', startPosition: 0, endPosition: 4, type: '疑问代词', explanation: '询问事件或活动内容' },
      { id: 'sa-3-2', sentenceId: 's-3', text: 'did', startPosition: 5, endPosition: 8, type: '助动词', explanation: '过去时标记' },
      { id: 'sa-3-3', sentenceId: 's-3', text: 'you', startPosition: 9, endPosition: 12, type: '主语', explanation: '行动主体' },
      { id: 'sa-3-4', sentenceId: 's-3', text: 'do', startPosition: 13, endPosition: 15, type: '实义动词', explanation: '表示进行动作' },
      { id: 'sa-3-5', sentenceId: 's-3', text: 'yesterday', startPosition: 16, endPosition: 25, type: '时间副词', explanation: '限定时间为昨天' }
    ]
  },
  {
    id: 's-4',
    content: 'I went to school in the morning.',
    translation: '我早晨去上学了。',
    level: 'A1',
    difficulty: 1,
    steps: [
      { id: 'ss-4-1', sentenceId: 's-4', stepNumber: 1, content: 'I went to school', translation: '我去上学', phonetic: '/aɪ went tuː skuːl/', type: 'PHRASE' },
      { id: 'ss-4-2', sentenceId: 's-4', stepNumber: 2, content: 'in the morning', translation: '在早晨', phonetic: '/ɪn ðə ˈmɔːnɪŋ/', type: 'PHRASE' },
      { id: 'ss-4-3', sentenceId: 's-4', stepNumber: 3, content: 'I went to school in the morning.', translation: '我早晨去上学了。', phonetic: '/aɪ went tuː skuːl ɪn ðə ˈmɔːnɪŋ/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-4-1', sentenceId: 's-4', text: 'I went to school', startPosition: 0, endPosition: 16, type: '主干结构', explanation: '主谓宾/介词短语习惯表达' },
      { id: 'sa-4-2', sentenceId: 's-4', text: 'in the morning', startPosition: 17, endPosition: 31, type: '时间状语', explanation: '固定介词短语' }
    ]
  },
  {
    id: 's-5',
    content: 'The weather is very beautiful today.',
    translation: '今天的天气非常宜人美好。',
    level: 'A1',
    difficulty: 1,
    steps: [
      { id: 'ss-5-1', sentenceId: 's-5', stepNumber: 1, content: 'The weather', translation: '天气', phonetic: '/ðə ˈweðə(r)/', type: 'WORD' },
      { id: 'ss-5-2', sentenceId: 's-5', stepNumber: 2, content: 'is very beautiful', translation: '非常美丽美好', phonetic: '/ɪz ˈveri ˈbjuːtɪfl/', type: 'PHRASE' },
      { id: 'ss-5-3', sentenceId: 's-5', stepNumber: 3, content: 'The weather is very beautiful', translation: '天气非常美好', phonetic: '/ðə ˈweðər ɪz ˈveri ˈbjuːtɪfl/', type: 'STRUCTURE' },
      { id: 'ss-5-4', sentenceId: 's-5', stepNumber: 4, content: 'The weather is very beautiful today.', translation: '今天的天气非常宜人美好。', phonetic: '/ðə ˈweðər ɪz ˈveri ˈbjuːtɪfl təˈdeɪ/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-5-1', sentenceId: 's-5', text: 'The weather', startPosition: 0, endPosition: 11, type: '主语', explanation: '特指当下的天气状况' },
      { id: 'sa-5-2', sentenceId: 's-5', text: 'is', startPosition: 12, endPosition: 14, type: '系动词', explanation: '连接主语与表语' },
      { id: 'sa-5-3', sentenceId: 's-5', text: 'very beautiful', startPosition: 15, endPosition: 29, type: '表语（形容词短语）', explanation: '描述天气属性特征' },
      { id: 'sa-5-4', sentenceId: 's-5', text: 'today', startPosition: 30, endPosition: 35, type: '时间状语', explanation: '副词修饰全句' }
    ]
  },
  {
    id: 's-6',
    content: 'Learning English requires practice and patience.',
    translation: '学习英语需要练习和耐心。',
    level: 'B1',
    difficulty: 2,
    steps: [
      { id: 'ss-6-1', sentenceId: 's-6', stepNumber: 1, content: 'Learning English', translation: '学习英语（动名词作主语）', phonetic: '/ˈlɜːnɪŋ ˈɪŋɡlɪʃ/', type: 'PHRASE' },
      { id: 'ss-6-2', sentenceId: 's-6', stepNumber: 2, content: 'requires', translation: '需要；要求', phonetic: '/rɪˈkwaɪəz/', type: 'WORD' },
      { id: 'ss-6-3', sentenceId: 's-6', stepNumber: 3, content: 'practice and patience', translation: '练习和耐心', phonetic: '/ˈpræktɪs ənd ˈpeɪʃns/', type: 'PHRASE' },
      { id: 'ss-6-4', sentenceId: 's-6', stepNumber: 4, content: 'Learning English requires practice and patience.', translation: '学习英语需要练习和耐心。', phonetic: '/ˈlɜːnɪŋ ˈɪŋɡlɪʃ rɪˈkwaɪəz ˈpræktɪs ənd ˈpeɪʃns/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-6-1', sentenceId: 's-6', text: 'Learning English', startPosition: 0, endPosition: 16, type: '动名词短语（主语）', explanation: '动名词短语作句子的主语，视为单数概念' },
      { id: 'sa-6-2', sentenceId: 's-6', text: 'requires', startPosition: 17, endPosition: 25, type: '谓语动词', explanation: '第三人称单数形式' },
      { id: 'sa-6-3', sentenceId: 's-6', text: 'practice and patience', startPosition: 26, endPosition: 47, type: '并列宾语', explanation: '由 and 连结的两个不可数名词' }
    ]
  },
  {
    id: 's-7',
    content: 'How can I improve my spoken English?',
    translation: '我怎样才能提高我的英语口语？',
    level: 'A2',
    difficulty: 2,
    steps: [
      { id: 'ss-7-1', sentenceId: 's-7', stepNumber: 1, content: 'How', translation: '如何；怎样', phonetic: '/haʊ/', type: 'WORD' },
      { id: 'ss-7-2', sentenceId: 's-7', stepNumber: 2, content: 'How can I', translation: '我怎样才能', phonetic: '/haʊ kæn aɪ/', type: 'STRUCTURE' },
      { id: 'ss-7-3', sentenceId: 's-7', stepNumber: 3, content: 'improve my spoken English', translation: '提高我的英语口语', phonetic: '/ɪmˈpruːv maɪ ˈspəʊkən ˈɪŋɡlɪʃ/', type: 'PHRASE' },
      { id: 'ss-7-4', sentenceId: 's-7', stepNumber: 4, content: 'How can I improve my spoken English?', translation: '我怎样才能提高我的英语口语？', phonetic: '/haʊ kæn aɪ ɪmˈpruːv maɪ ˈspəʊkən ˈɪŋɡlɪʃ/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-7-1', sentenceId: 's-7', text: 'How', startPosition: 0, endPosition: 3, type: '疑问方式副词', explanation: '询问途径或方法' },
      { id: 'sa-7-2', sentenceId: 's-7', text: 'can', startPosition: 4, endPosition: 7, type: '情态动词', explanation: '表示能力与可能性' },
      { id: 'sa-7-3', sentenceId: 's-7', text: 'I', startPosition: 8, endPosition: 9, type: '主语', explanation: '第一人称提问' },
      { id: 'sa-7-4', sentenceId: 's-7', text: 'improve', startPosition: 10, endPosition: 17, type: '谓语动词原形', explanation: '情态动词后接动词原形' },
      { id: 'sa-7-5', sentenceId: 's-7', text: 'my spoken English', startPosition: 18, endPosition: 35, type: '宾语短语', explanation: '过去分词 spoken 修饰 English 作定语' }
    ]
  },
  {
    id: 's-8',
    content: 'We spent the summer vacation with our family.',
    translation: '我们和家人一起度过了暑假。',
    level: 'A2',
    difficulty: 2,
    steps: [
      { id: 'ss-8-1', sentenceId: 's-8', stepNumber: 1, content: 'We spent', translation: '我们度过了', phonetic: '/wiː spent/', type: 'WORD' },
      { id: 'ss-8-2', sentenceId: 's-8', stepNumber: 2, content: 'the summer vacation', translation: '暑假', phonetic: '/ðə ˈsʌmə veɪˈkeɪʃn/', type: 'PHRASE' },
      { id: 'ss-8-3', sentenceId: 's-8', stepNumber: 3, content: 'with our family', translation: '与我们的家人一起', phonetic: '/wɪð ˈaʊə ˈfæməli/', type: 'PHRASE' },
      { id: 'ss-8-4', sentenceId: 's-8', stepNumber: 4, content: 'We spent the summer vacation with our family.', translation: '我们和家人一起度过了暑假。', phonetic: '/wiː spent ðə ˈsʌmə veɪˈkeɪʃn wɪð ˈaʊə ˈfæməli/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-8-1', sentenceId: 's-8', text: 'We', startPosition: 0, endPosition: 2, type: '主语', explanation: '第一人称复数' },
      { id: 'sa-8-2', sentenceId: 's-8', text: 'spent', startPosition: 3, endPosition: 8, type: '谓语动词', explanation: 'spend 的过去式，表示度过时间' },
      { id: 'sa-8-3', sentenceId: 's-8', text: 'the summer vacation', startPosition: 9, endPosition: 28, type: '宾语', explanation: '名词词组，度过的对象' },
      { id: 'sa-8-4', sentenceId: 's-8', text: 'with our family', startPosition: 29, endPosition: 44, type: '伴随状语', explanation: '介词 with 引导伴随对象' }
    ]
  },
  {
    id: 's-9',
    content: 'The teacher asked an important question.',
    translation: '老师问了一个重要的问题。',
    level: 'A1',
    difficulty: 1,
    steps: [
      { id: 'ss-9-1', sentenceId: 's-9', stepNumber: 1, content: 'The teacher', translation: '老师', phonetic: '/ðə ˈtiːtʃə(r)/', type: 'WORD' },
      { id: 'ss-9-2', sentenceId: 's-9', stepNumber: 2, content: 'asked', translation: '提出了/询问了', phonetic: '/ɑːskt/', type: 'WORD' },
      { id: 'ss-9-3', sentenceId: 's-9', stepNumber: 3, content: 'an important question', translation: '一个重要的问题', phonetic: '/ən ɪmˈpɔːtnt ˈkwestʃən/', type: 'PHRASE' },
      { id: 'ss-9-4', sentenceId: 's-9', stepNumber: 4, content: 'The teacher asked an important question.', translation: '老师问了一个重要的问题。', phonetic: '/ðə ˈtiːtʃər ɑːskt ən ɪmˈpɔːtnt ˈkwestʃən/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-9-1', sentenceId: 's-9', text: 'The teacher', startPosition: 0, endPosition: 11, type: '主语', explanation: '名词词组' },
      { id: 'sa-9-2', sentenceId: 's-9', text: 'asked', startPosition: 12, endPosition: 17, type: '谓语动词', explanation: 'ask 的一般过去式' },
      { id: 'sa-9-3', sentenceId: 's-9', text: 'an important question', startPosition: 18, endPosition: 39, type: '直接宾语', explanation: '不定冠词 an + 形容词 + 名词' }
    ]
  },
  {
    id: 's-10',
    content: 'Reading books helps us gain new knowledge.',
    translation: '读书有助于我们获取新知识。',
    level: 'B1',
    difficulty: 2,
    steps: [
      { id: 'ss-10-1', sentenceId: 's-10', stepNumber: 1, content: 'Reading books', translation: '读书（动名词短语）', phonetic: '/ˈriːdɪŋ bʊks/', type: 'PHRASE' },
      { id: 'ss-10-2', sentenceId: 's-10', stepNumber: 2, content: 'helps us', translation: '帮助我们', phonetic: '/helps ʌs/', type: 'STRUCTURE' },
      { id: 'ss-10-3', sentenceId: 's-10', stepNumber: 3, content: 'gain new knowledge', translation: '获得新知识', phonetic: '/ɡeɪn njuː ˈnɒlɪdʒ/', type: 'PHRASE' },
      { id: 'ss-10-4', sentenceId: 's-10', stepNumber: 4, content: 'Reading books helps us gain new knowledge.', translation: '读书有助于我们获取新知识。', phonetic: '/ˈriːdɪŋ bʊks helps ʌs ɡeɪn njuː ˈnɒlɪdʒ/', type: 'SENTENCE' }
    ],
    analyses: [
      { id: 'sa-10-1', sentenceId: 's-10', text: 'Reading books', startPosition: 0, endPosition: 13, type: '动名词短语（主语）', explanation: '主语表示阅读书籍这一动作' },
      { id: 'sa-10-2', sentenceId: 's-10', text: 'helps', startPosition: 14, endPosition: 19, type: '谓语动词', explanation: '三单形式' },
      { id: 'sa-10-3', sentenceId: 's-10', text: 'us', startPosition: 20, endPosition: 22, type: '宾语', explanation: '代词宾格' },
      { id: 'sa-10-4', sentenceId: 's-10', text: 'gain new knowledge', startPosition: 23, endPosition: 41, type: '宾语补足语', explanation: '省略 to 的不定式作宾补 (help sb do sth)' }
    ]
  }
];
