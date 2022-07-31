


//返回代表最长递增子序列的角标数组;
export function getSequence(arr: number[]): number[] {
  //1)默认追加;
  //2)替换;
  //3)记录每个人的前驱节点;
  //4)通过最后一项进行回溯,把result每一项的值改对;

  const len = arr.length
  const result = [0];//结果集,存放最有潜力的最长递增子序列对应的角标数组;//以默认第0个为基准来做序列;
  const p = new Array(len).fill(0);//最后要标记索引,即存放`入参数组值`在`角标结果集`中`前一项对应的入参数组索引`;

  let resultLastIndex: number//记录结果集里最后一项的角标;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i] //表示当前循环到的入参数组项;

    //因为vue里面的序列中0-->意味着没有意义,肯定需要创建与插入;
    if (arrI === 0) {
      continue
    }


    resultLastIndex = result[result.length - 1]

    if (arr[resultLastIndex] < arrI) {//比较最后一项和当前项的值,如果比最后一项大,则将当前索引放到结果集中;
      result.push(i)

      p[i] = resultLastIndex//当前放到末尾的要记住他前面的那个人是谁;//即在`角标结果集`中`前一项对应的入参数组索引`;
      continue
    }

    //这里需要通过二分查找,在结果集中找到比当前值大的,用当前值的索引将其替换掉;
    //递增序列,采用二分查找是最快的;
    let start = 0;//记录结果集二分查找开始角标;
    let end = result.length - 1;//记录结果集二分查找末尾角标;
    let middle;//记录结果集二分查找中间值(即当前要比对的值);
    for (; start < end;) {//start===end的时候就停止了; .. //这个二分查找是在找索引;
      middle = ((start + end) / 2) | 0//向下取整,在`((start + end) / 2)>=0`时,`((start + end) / 2) | 0`相当于`Math.floor(((start + end) / 2))`;
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
    //找到中间值后,需要做替换操作;
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

  for (let i = result.length - 1, last = result[i]; i >= 0; last = p[last], i--) {//倒叙追溯;
    result[i] = last//最后一项是确定的;
  }

  //console.log('p--->', p)

  return result
}

//const result = getSequence([5, 3, 4, 0]);
//console.log('result--->', JSON.parse(JSON.stringify(result)))
