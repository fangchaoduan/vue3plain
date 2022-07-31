//求最长递增子序列的个数;//不用连续递增,只要增加就行了;
//[3,2,8,9,5,6,7,11,15] ->
//[2,8,9,11,15]//不对;
//[2,5,6,7,11,15];//要怎么知道这个数组?
//先要知道这个数组中数组元素的个数,之后再知道这个数组中的倒数第一个数组元素,由倒数第一个数组元素倒推出倒数第二个,依次倒推,直到这个数组的第一个;

//贪心算法 + 二分查找;//贪心算法求出个数,而二分查找是方便贪心算法计算替换更有潜力的元素;
//[3,2,8,9,5,6,7,11,15,4] ->个数;
//找更有潜力的;
//3;//先取第一个;
//2;//2比3小,用2替换数组之前的某个值;
//2,8;//8比数组最后一个还大,直接放到数组尾部;
//2,8,9;//9比数组最后一个还大,直接放到数组尾部;
//2,5,9;//5比数组最后一个小,要把5插入到数组中,用二分查找找到角标[1]的值,发现5比角标[1]要小,但比角标[1]前一个值小,所以用5替换角标[1]之前的值;
//2,5,6;
//2,5,6,7;
//2,5,6,7,11,15;

//2,4,6,7,11,15;
//发现序列顺序是错的,但序列个数正好是最长递增子序列的个数;

//1.思路就是当前这个项比`保存数组最后一项`大则直接放到`保存数组`末尾;
//2.如果当前这一项比`保存数组最后一项`小,需要在序列中通过二分查找找到比当前大的这一项,用他来替换掉`保存数组中正好比他大的最小值`;
//3.最优的情况,就是默认递增;

/* //返回代表最长递增子序列的角标数组;
function getSequence(arr) {
  const len = arr.length
  const result = [0];//结果集,存放最有潜力的最长递增子序列对应的角标数组;//以默认第0个为基准来做序列;
  let resultLastIndex
  for (let i = 0; i < len; i++) {
    const arrI = arr[i]

    //因为vue里面的序列中0-->意味着没有意义,肯定需要创建与插入;
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {//比较最后一项和当前项的值,如果比最后一项大,则将当前索引放到结果集中;
        result.push(i)
        continue
      }
    }

  }

  return result
}
const result = getSequence([ 1, 2, 3, 4, 5, 6, 7, 0]);//`值为0`代表不参与最长递增子序列的递增;
console.log('result--->', JSON.parse(JSON.stringify(result))) */


//返回代表最长递增子序列的角标数组;
function getSequence(arr) {
  const len = arr.length
  const result = [0];//结果集,存放最有潜力的最长递增子序列对应的角标数组;//以默认第0个为基准来做序列;
  //const p = arr.slice(0);//最后要标记索引,即存放`入参数组值`在`角标结果集`中`前一项对应的入参数组索引`;
  const p = new Array(len).fill(0);//最后要标记索引,即存放`入参数组值`在`角标结果集`中`前一项对应的入参数组索引`;

  let start;//记录结果集二分查找开始角标;
  let end;//记录结果集二分查找末尾角标;
  let middle;//记录结果集二分查找中间值(即当前要比对的值);

  let resultLastIndex//记录结果集里最后一项的角标;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i] //表示当前循环到的入参数组项;

    //因为vue里面的序列中0-->意味着没有意义,肯定需要创建与插入;
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1]

      if (arr[resultLastIndex] < arrI) {//比较最后一项和当前项的值,如果比最后一项大,则将当前索引放到结果集中;
        result.push(i)

        p[i] = resultLastIndex//当前放到末尾的要记住他前面的那个人是谁;//即在`角标结果集`中`前一项对应的入参数组索引`;
        continue
      }

      //这里需要通过二分查找,在结果集中找到比当前值大的,用当前值的索引将其替换掉;
      //递增序列,采用二分查找是最快的;
      start = 0;
      end = result.length - 1;
      for (; start < end;) {//start===end的时候就停止了; .. //这个二分查找是在找索引;
        middle = ((start + end) / 2) | 0//向下取整,在`((start + end) / 2)>=0`时,`((start + end) / 2) | 0`相当于`Math.floor(((start + end) / 2))`;

        //[3 6 9 12 15 18 21 24 27 18]//arr为[3 6 9 12 15 18 21 24 27 18],在result为[1 2 3 4 5 6 7 8 9]要插入19;
        //1 2 3 4 5 6 7 8 9 ;  //插入 19; //即arrI为19,result为[1 2 3 4 5 6 7 8 9];
        //1 2 3 4 middle 6 7 8 9 ;  //start=0,end=8,middle=4,arrI=19,result[middle]=result[4]=5,arr[result[middle]]=arr[5]=18;
        //1 2 3 4 5 6 middle 8 9 ;  //start=5,end=8,middle=6,arrI=19,result[middle]=result[6]=7,arr[result[middle]]=arr[7]=24;
        //1 2 3 4 5 middle 7 8 9 ;  //start=5,end=6,middle=5,arrI=19,result[middle]=result[5]=6,arr[result[middle]]=arr[6]=21;
        //1 2 3 4 5 middle 7 8 9 ;  //start=5,end=5,middle=5,arrI=19;

        //result[middle]表示当前结果集中存放的某个入参数组的角标;
        //arr[result[middle]]表示某个入参数组的值;
        //1 2 3 4 middle 6 7 8 9 ;  6;
        if (arr[result[middle]] < arrI) {
          //比当前值小,说明要向右即向后查找;
          //所以把下次查找的结果集二分查找开始角标
          start = middle + 1
        } else {
          end = middle
        }
      }
      //找到中间值后,需要做替换操作; start / end;
      if (arr[result[end]] > arrI) {
        result[end] = i;//这里用当前这一项,替换掉已有的比当前大的那一项;更有潜力的我需要他;

        p[i] = result[end - 1]//记住它的前一个人是谁;//即在`角标结果集`中`前一项对应的入参数组索引`;
        //p[i]其实就类似于arrI;
        //result[end]是arrI于入参数组的索引;
        //`end`是`arrI于入参数组的索引`在结果集的角标;
        //`end - 1`是`arrI于入参数组的索引`在结果集的前一项角标;
        //`result[end - 1]`是`arrI位于结果集中前一项值于arr中的角标`;
        //`arr[result[end - 1]]`是`arrI位于结果集中前一项值`;
        //`result[end - 1]`是`arrI位于结果集中前一项值`在arr中的角标;
      }

    }

  }

  //1)默认追加;
  //2)替换;
  //3)记录每个人的前驱节点;
  //4)通过最后一项进行回溯,把result每一项的值改对;
  // let i = result.length
  // let last = result[i - 1]//找到最后一项了;
  // for (; i-- > 0;) {//倒叙追溯;
  //   result[i] = last//最后一项是确定的;
  //   last = p[last]
  // }

  for (let i = result.length - 1, last = result[i]; i >= 0; last = p[last], i--) {//倒叙追溯;
    result[i] = last//最后一项是确定的;
  }

  //console.log('p--->', p)

  return result
}
/* const result = getSequence([3, 2, 8, 9, 5, 6, 7, 11, 15, 4]);//`值为0`代表不参与最长递增子序列的递增;
console.log('result--->', JSON.parse(JSON.stringify(result)))
console.log('result.length--->', JSON.parse(JSON.stringify(result)).length)//6; */

const result = getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]);
console.log('result--->', JSON.parse(JSON.stringify(result)))
//console.log('result.length--->', JSON.parse(JSON.stringify(result)).length)//6;

//2,4,6,7,11,15;
//1,9,5,6,7,8; //个数目前是对的,需要将序列再改对;

//找更有潜力的;
//3;
//2;
//2,8;
//2,8,9;
//2,5,9;
//2,5,6;
//2,5,6,7;
//2,5,6,7,11,15;
//2,4,6,7,11,15;
//1,9,5,6,7,8;//对应索引;


//数组: [2,3,1,5,6,8,7,9,4]
//索引: [0,1,2,3,4,5,6,7,8]
//最小递增数组: [2,3,5,6,7,9]
// 2
// 2,3
// 1,3
// 1,3,5
// 1,3,5,6
// 1,3,5,6,8
// 1,3,5,6,7
// 1,3,5,6,7,9
// 1,3,4,6,7,9


//数组: [2,3,1,5,6,8,7,9,4]
//索引: [0,1,2,3,4,5,6,7,8]
// 2 //2的前面值是undefined,前面值的索引为undefined;
// 2,3 //3的前面值是2,前面值的索引为0;
// 1,3 //1的前面值是undefined,前面值的索引为undefined;
// 1,3,5 //5的前面值是3,前面值的索引为1;
// 1,3,5,6 //6的前面值是5,前面值的索引为3;
// 1,3,5,6,8 //8的前面值是6,前面值的索引为4;
// 1,3,5,6,7 //7的前面值是6,前面值的索引为4;
// 1,3,5,6,7,9 //9的前面值是7,前面值的索引为6;
// 1,3,4,6,7,9 //4的前面值是3,前面值的索引为1;

//最小递增数组: [2,3,5,6,7,9];
//最后的值是9,9的索引是7;
//9的前一个值是索引为6的7,7的索引是6;
//7的前一个值是索引为4的6,6的索引是4;
//6的前一个值是索引为3的5,5的索引是3;
//5的前一个值是索引为1的3,3的索引是1;
//3的前一个值是索引为0的2,2的索引是0;
//2的前一个值是索引为undefined的undefined,undefined的索引是undefined;
//所以有[undefined,0,1,3,4,6,7]-->[0,1,3,4,6,7];
//最小索引数组: [0,1,3,4,6,7];
//原因是因为最后一个总是对的,并且前一项必定已经在它的前面了;



//最后一步,可以通过标记索引的方式,最终通过最后一项将结果还原;