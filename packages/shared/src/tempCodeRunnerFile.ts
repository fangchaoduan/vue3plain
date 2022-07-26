const enum ShapeFlags {
  ELEMENT = 1, //1<<0; //元素; 
  FUNCTIONAL_COMPONENT = 2, //1<<1; //;
  STATEFUL_COMPONENT = 4, //1<<2; //;
  TEXT_CHILDREN = 8, //1<<3; //;
  ARRAY_CHILDREN = 16, //1<<4; //;
  SLOTS_CHILDREN = 32, //1<<5; //;
  TELEPORT = 64, //1<<6; //;
  SUSPENSE = 128, //1<<7; //;
  COMPONENT_SHOULD_KEEP_ALIVE = 256, //1<<8; //;
  COMPONENT_KEPT_ALIVE = 512, //1<<9; //;
  COMPONENT = 6 //COMPONENT = ShapeFlags.FUNCTIONAL_COMPONENT | ShapeFlags.STATEFUL_COMPONENT; //即: COMPONENT = 2 | 4;
}
const 有子元素的元素 = ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN
console.log('有子元素的元素--->',有子元素的元素)