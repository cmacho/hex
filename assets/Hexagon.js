function Hexagon(props) {
  var colorStyle;
  if (props.color === 1) {
    colorStyle = { backgroundColor: "red" };
  } else if (props.color === 2) {
    colorStyle = { backgroundColor: "blue" };
  } else {
    colorStyle = {};
  }
  return (
    <div className="hexagon" style={colorStyle} onClick={props.onClick}></div>
  );
}

export default Hexagon;
