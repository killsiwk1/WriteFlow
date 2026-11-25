const prompts={
sentence:[
['仿写','I take the bus because my school is far away.','用 because 写一句话，解释你选择某种出行方式的原因。','I walk to the shop because it is close to home.','because 后面接完整句子。'],
['仿写','The more I read, the easier it gets.','用 the more… 结构写出练习带来的变化。','The more I cook, the better my soup tastes.','两个比较结构要表达有关联的变化。'],
['扩写','The bus arrived.','加入时间、地点，以及等车人的反应。','The bus arrived at the village gate at noon, and we waved to the driver.','先保留主干，再补时间或地点。'],
['扩写','I opened the box.','加入方式和原因，让读者知道你在担心什么。','I opened the box slowly because I could hear something moving inside.','副词描述方式，because 引出原因。'],
['改写','The bag is so heavy that I cannot lift it.','保留原意，改用 too…to。','The bag is too heavy for me to lift.','for me 保留了原句中动作的执行者。'],
['改写','Mia took this photo last winter.','把照片放在句首，保留人物和时间。','This photo was taken by Mia last winter.','过去时被动语态为 was/were + 过去分词。'],
['补全','I was walking home when ____.','写一个突然发生的、打断原动作的事件。','I was walking home when a bike bell rang behind me.','背景常用过去进行时，短动作用一般过去时。'],
['补全','If the weather is fine tomorrow, ____.','补全自己的安排。','If the weather is fine tomorrow, we will take our lunch to the park.','条件从句用一般现在时，主句可以用 will。']],
paragraph:[
['主题段落','A place I know well','写三到五句，先说地点，再用两个细节说明你为什么熟悉它。','My favorite place is the little shop by our school. The owner knows my name. On rainy days, she lets me wait by the window.','主题句之后用具体细节。'],
['提示词','A missed bus','试着使用 late、stop、instead、finally，写出经过。','I left home late and ran to the stop. The bus was gone, so I walked instead. I finally reached school just before class.','按时间顺序组织，统一过去时。'],
['续写开头','When I opened my schoolbag, I found a small key.','接着写三到五句，交代钥匙的来历。','There was a paper tag on it. I knew the handwriting. My sister had put her locker key in the wrong bag.','用物品线索连接前后句。'],
['补写结尾前文','That was how our quiet afternoon turned into an adventure.','用给出的句子收尾，先写事情的起因和转折。','We were reading by the river when a hat floated past. My brother followed it along the bank. That was how our quiet afternoon turned into an adventure.','前文要能解释结尾的变化。'],
['中文组段','一次借书经历','周六去图书馆；想借的书被借走了；管理员推荐另一本；说说你的感受。','I visited the library on Saturday. The book I wanted was already out. The librarian showed me another one, and its first page made me laugh.','用简单句交代事件，用 and 或 but 连接。'],
['图片描述','Describe a local photo','选择设备上的一张照片。先写整体场景，再写两个可见细节。','In my photo, two children are standing by a lake. One is holding a red bucket. Behind them, a small boat is tied to a tree.','示例描述的是另一张照片。根据自己照片中看得到的细节来写。']],
translate:[
['日常句子','我每天步行去学校，因为学校离我家很近。','留意日常习惯与原因。','I walk to school every day because it is close to my home.\nI go to school on foot every day because I live nearby.','walk 与 go on foot 都可表达步行。'],
['过去经历','我到车站的时候，公交车已经开走了。','区分两个动作发生的先后。','By the time I got to the stop, the bus had already left.\nWhen I reached the bus stop, the bus had already gone.','先开走，再到达。用过去完成时表示更早的动作。'],
['实用表达','请问，我可以把这本书再借一周吗？','想想表示借用持续时间的动词。','Could I keep this book for another week, please?\nMay I keep the book for one more week?','keep 可以表示把书留在手里一段时间。'],
['短文翻译','昨天下起了雨。我们在屋里等了十分钟，然后一起走回家。','统一叙事时间，连接连续动作。','It started to rain yesterday. We waited inside for ten minutes and then walked home together.','for 引出时长，then 表示先后。'],
['观点表达','我觉得和朋友一起练习，比独自背句子更有意思。','用比较级说明个人偏好。','I think practicing with a friend is more interesting than memorizing sentences alone.','比较的两项都可以用 -ing 短语。'],
['短文翻译','我以前不爱写日记。现在我每天记下一件小事，这让我更留心身边的生活。','描述过去与现在的变化。','I used to dislike keeping a diary. Now I write down one small thing every day. It helps me notice more of what happens around me.','used to 描述过去的习惯，now 引出改变。']],
guided:[
['日常生活','A quiet morning','建议 60–90 词。选一个普通的早晨，写出一个声音、一个动作和你的感受。','I woke up before my alarm. In the kitchen, I could hear water boiling.','可用 before、while、usually。'],
['个人经历','Something I fixed','建议 70–110 词。交代问题、第一次尝试，以及你最后怎样解决它。','The wheel on my suitcase stopped turning just before our trip.','可用 at first、try、finally。'],
['观点表达','Study alone or with a friend?','建议 80–120 词。表达自己的偏好，用一个真实例子支持它。','I like studying with a friend when I need to practice speaking.','可用 in my opinion、for example、however。'],
['事物描述','An object with a story','建议 60–100 词。描写物品的样子，并交代它为什么对你特别。','The old watch in my drawer no longer works, but I still keep it.','可用 belong to、remind、keep。'],
['故事创作','The wrong envelope','建议 80–130 词。用一个拿错的信封开场，写出误会和结尾。','I noticed the wrong name on the envelope just as the bus pulled away.','可用 notice、instead、in the end。'],
['实用写作','An invitation','建议 50–80 词。写一封便条邀请朋友参加活动，说明时间、地点和需要携带的物品。','Hi Sam, would you like to come to our picnic this Saturday?','可用 would you like、bring、let me know。']],
free:[['自由写作','','自定标题，写下今天想用英语表达的事。','','']]};
