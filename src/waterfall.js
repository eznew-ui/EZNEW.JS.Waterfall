Array.prototype.remove=function(e){
	if(!this) return;
	var alen=this.length;
	if(alen>0){for(var i=alen;i>=0;i--){this[i]===e&&this.splice(i,1)}};
};

var _water = function (ele, options) {
    if (!ele.position()) {
        return this;
    }
	this.Options=$.extend({
		columnWidth: 240,
		columnSpace: 15,
		minColumn: 3,
		maxColumn: 6,
		columnSelector: ".item",
		sideSpace: 0,
		hibernate: 5e3,
		toleranceValue: 500,
		nearBottom: 100,
		load: null
	},options);
	this.Element=ele;
	this.ContainerElement=ele.parent();
	this.ElementTop=this.Element.position().top;
	this.Columns=0;
	this.Width=0;
	this.Height=0;
	this.Items=[];
	this.ShowItems=[];
	this.ColumnPositions=[];
	this.LastScrollTop=0;
	this.BeginValue=0;
	this.EndValue=0;
	this.MinCol=0;
	$this=this;
	this.nowLoad=!1;
	this.Options.columnSelector&&$(this.Options.columnSelector).each(function(index,ele){
		$this.Items.push($this.CreateNewCell(ele));
	});
	this.Reset(!0);
	this.BindEvent();
};
_water.prototype={
	Init:function(){},
	CreateNewCell:function(ele,po){
		var item = new _watercell(ele, this);
        return po && (item = this.Position(item)),
        item
	},
	ResetLayout:function(isRes){
		var colWidth=this.Options.columnWidth+this.Options.columnSpace;
		var contentWidth=this.ContainerElement.width()-this.Options.sideSpace*2;
		var colNum=Math.floor(contentWidth/colWidth);
		colNum>this.Options.maxColumn&&(colNum=this.Options.maxColumn),colNum<this.Options.minColumn&&(colNum=this.Options.minColumn);
		if(!isRes&&this.Columns==colNum) return !1;
		var elementWidth=colNum*colWidth-this.Options.columnSpace;
		if((elementWidth+colWidth)<=contentWidth){
			elementWidth+=colWidth;
			colNum++;
		}
		var colPosition=[];
		for(var c=0;c<colNum;c++){
			colPosition.push(0);
		};
		this.Width=elementWidth,this.ColumnPositions=colPosition,this.Columns=colNum,this.Element.width(this.Width);
		return !0;
	},
	Reset:function(isRes){
		if(this.ResetLayout(isRes)){
			var items=this.Items;
			var ilen=items.length;
			for(var i=0;i<ilen;i++){
				this.Position(items[i]);
			}
			this.UpdateShowItems(!0);
		}
		return this;
	},
	Position:function(ele){
		var cols=this.Columns,minCol=0,maxCol=0,colPositions=this.ColumnPositions;
		for(var c=0;c<cols;c++){
			colPositions[c]<colPositions[minCol]&&(minCol=c);
			colPositions[c]>colPositions[maxCol]&&(maxCol=c);
		}
		var height=colPositions[maxCol];
		var left=minCol*(this.Options.columnWidth+this.Options.columnSpace);
		var top=colPositions[minCol];
		ele.Position(left,top,minCol);
		colPositions[minCol]+=ele.Height+this.Options.columnSpace;
		if(colPositions[minCol]>colPositions[maxCol]){maxCol=minCol;height=colPositions[minCol]};
		height+=this.Items[maxCol].Height;
		this.Element.height(height);
		return ele;
	},
	UpdateShowItems:function(usi){
		if (!this.Options.hibernate || this._height < this.Options.hibernate) return;
		var ilen=this.Items.length;
		if(ilen<=0) return;
		var scrollTop=$(window).scrollTop();
		var chaValue=Math.abs(scrollTop-this.LastScrollTop);
		if(!usi&&chaValue<50) return;
		var winHeight=$(window).height();
		var elementTop=this.Element.offset().top;
		var beginValue=scrollTop>elementTop?scrollTop-elementTop:0;
		var endValue=beginValue+winHeight+this.Options.toleranceValue;
		beginValue-=this.Options.toleranceValue;
		beginValue<0&&(beginValue=0);
		this.BeginValue=beginValue;
		this.EndValue=endValue;
		this.UpdateColumns();
		this.LastScrollTop=scrollTop;
	},
	UpdateColumns:function(){
		var ilen=this.Items.length;
		var bi=0;
		var ei=ilen-1;
		var ni=0,nitems=[];
		while(ei>bi){
			ni=Math.floor((bi+ei)/2);
			var nele=this.Items[ni];
			if(nele.Bottom<this.BeginValue||nele.Top>this.EndValue){
				if(nele.Top>this.EndValue){
					ei=ni-1;
					continue;
				}
				bi=ni+1;
				continue;
			}
			break;
		}
		nitems.push(this.Items[ni]);
		for(var i=ni+1,ln=10;i<ilen&&ln>0;i++){
			var nele=this.Items[i];
			nele.Bottom<this.BeginValue||nele.Top>this.EndValue?ln--:nitems.push(nele);
		};
		for(var i=ni-1,ln=10;i>=0&&ln>0;i--){
			var nele=this.Items[i];
			nele.Bottom<this.BeginValue||nele.Top>this.EndValue?ln--:nitems.unshift(nele);
		};
		var slen=this.ShowItems.length;
		var ritems=[];
		for(var i=0;i<slen;i++){
			var nsele=this.ShowItems[i];
			if($.inArray(nsele,nitems)==-1&&(nsele.Bottom<this.BeginValue||nsele.Top>this.EndValue)){
				ritems.push(nsele);
			}
		};
		var ulen=nitems.length;
		for(var u=0;u<ulen;u++){
			nitems[u].AddCell();
		}
		var rlen=ritems.length;
		for(var r=0;r<rlen;r++){
			ritems[r].DeleteCell();
		}
	},
	BindEvent:function(){
		$(window).bind("resize",{obj:this},this.WindowResize);
		$(window).bind("scroll",{obj:this},this.WindowScroll);
	},
	AppendElement:function(ele){
		if(!ele) return;
		var $ele=$(ele);
		$ele.css("left","0px");
		$ele.css("top","100%");
		var newItem=this.CreateNewCell(ele,!0);
		this.Items.push(newItem);
		return newItem;
	},
	WindowResize:function(e){
		e.data.obj.Reset();
	},
	WindowScroll:function(e){
		var $this=e.data.obj;
		$this.UpdateShowItems();
		if(!$this.Options.load||$this.nowLoad) return;
		var winHeight=$(window).height();
		var scrollTop=$(window).scrollTop();
		var minHeight=$this.ColumnPositions[$this.MinCol];
		var eleTop=$this.ElementTop;
		if(winHeight+scrollTop<minHeight+eleTop-$this.Options.nearBottom) return;
		console.log((winHeight+scrollTop)+":"+(minHeight+eleTop-$this.Options.nearBottom));
		$this.nowLoad=!0;
		$this.Options.load();
	}
};

var _watercell=function(ele,wat){
		this.Waterfall = wat,
        this.Element=ele,
		this.JElement=$(ele);
        this.JElement.css("position", "absolute").appendTo(wat.Element),
        this.Col = 0,
        this.Left = this.Top = this.Bottom = -1,
		this.Height=this.JElement.height();
        this.Attached = !!(this.Element.parentNode||ele.parent()),
		this.AddToWaterfall();
};
_watercell.prototype={
	Position:function(left,top,col){
		this.Left=left,this.Top=top,this.Bottom=top+this.Height,this.JElement.css({top:top,left:left}),this.Col=col;
	},
	AddToWaterfall:function(){
		this.Attached?this.Waterfall.ShowItems.push(this):this.Waterfall.ShowItems.remove(this);
	},
	AddCell:function(){
		if(this.Attached) return;
		var waterEle=this.JElement;
		waterEle.appendTo(this.Waterfall.Element);
		Modernizr.csstransitions ? waterEle.css("opacity", 1) : waterEle.css("display", "");
		this.Attached = !0;
		this.AddToWaterfall();
	},
	DeleteCell:function(){
		if(!this.Attached) return;
		var waterEle=this.JElement;
		//this.Element.parentNode.removeChild(this.Element);
		waterEle.remove();
		Modernizr.csstransitions ? waterEle.css("opacity", 0) : waterEle.css("display", "none");
		this.Attached=!1;
		this.AddToWaterfall();
	}
};

(function($){
    $.fn.leewaterfall = function (options) {
		return new _water(this,options);
	};
})(jQuery);


