const queue: Array<Function> = []//任务队列,要执行的回调方法的队列;
let isFlushing = false;//是否正在执行队列;
const resolvePromise = Promise.resolve()

export function queueJob(job: Function | null) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  if (!isFlushing) {
    isFlushing = true
    resolvePromise.then(() => {
      isFlushing = false

      const copy = queue.slice(0)//因为在执行时,可能会把一些方法丢进queue中,导致queue数组长度一起变化;
      for (let i = 0; i < copy.length; i++) {
        const job = copy[i]
        job()
      }
      queue.length = 0
      copy.length = 0
    })
  }
}