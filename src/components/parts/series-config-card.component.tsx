import { AttributeFilter } from "@/components/parts/attribute-filter.component";
import { PrefectureFilter } from "@/components/parts/prefecture-filter.component";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JAPANESE_ATTRIBUTE_NAME,
  OBJECT_CLASS,
  OBJECT_CLASS_ATTRIBUTES,
  ObjectClass,
  ObjectClassAttribute,
  PREFECTURES,
} from "@/interfaces/aggregated-data.interface";
import {
  defaultSeriesName,
  GRAPH_TYPES,
  GraphSeries,
  GraphType,
  SERIES_PROPERTY_EFFECT_TO,
} from "@/interfaces/graph-series.interface";
import { Placement, PLACEMENTS } from "@/interfaces/placement.interface";
import { cn } from "@/lib/utils";
import { MouseEventHandler, useEffect, useState } from "react";
import { TrashIcon } from "@primer/octicons-react";

interface Props {
  series: GraphSeries;
  notify: (series: GraphSeries) => void;
  onRemoveClick: MouseEventHandler;
}

function updateSeriesProperty<Key extends keyof GraphSeries>(
  [key, value]: [Key, GraphSeries[Key]],
  series: GraphSeries,
): GraphSeries {
  const effectedProperties = SERIES_PROPERTY_EFFECT_TO[key]?.reduce(
    (obj, propertyKey) => ({
      ...obj,
      [propertyKey]: propertyKey === "graphType" ? "simple" : undefined,
    }),
    {} as Partial<GraphSeries>,
  );
  return {
    ...series,
    [key]: value,
    ...effectedProperties,
  };
}

export function SeriesConfigCard({ series, notify, onRemoveClick }: Props) {
  const [tempGraphType, setTempGraphType] = useState<GraphType>(series.graphType);
  // seriesが切り替わったときは一時状態もリセット
  useEffect(() => {
    setTempGraphType(series.graphType);
  }, [series.id]);

  // 「表示する」チェックボックスの変更ハンドラ
  const handleShowChange = (v: boolean) => {
    notify(updateSeriesProperty(["show", !!v], series));
  };

  // 系統名入力の変更ハンドラ
  const handleNameChange = (v: React.ChangeEvent<HTMLInputElement>) => {
    notify(updateSeriesProperty(["name", v.target.value ? v.target.value : undefined], series));
  };

  // 設置場所変更のハンドラ
  const handlePlacementChange = (v: Placement) => {
    setTempGraphType("simple");
    notify(updateSeriesProperty(["placement", v], series));
  };

  // 検出対象（objectClass）変更のハンドラ
  const handleObjectClassChange = (v: ObjectClass) => {
    setTempGraphType("simple");
    notify(updateSeriesProperty(["objectClass", v], series));
  };

  // 属性選択時にまとめて更新
  const handleAttributeChange = (v: ObjectClassAttribute) => {
    notify({
      ...series,
      graphType: tempGraphType,
      focusedAttribute: v,
    });
  };

  // ラジオボタン変更時の処理
  const handleGraphTypeChange = (selectedGraphType: GraphType) => {
    setTempGraphType(selectedGraphType);
    // 単純棒グラフ選択時や、属性選択後は即時反映
    if (selectedGraphType === "simple" || series.focusedAttribute !== undefined) {
      notify({
        ...series,
        graphType: selectedGraphType,
        focusedAttribute: selectedGraphType === "simple" ? undefined : series.focusedAttribute,
      });
    }
  };
  return (
    <Card className="flex w-full flex-col gap-y-4 p-4">
      <div className="flex justify-between">
        <label className="flex flex-row items-center gap-x-2">
          <Checkbox onCheckedChange={handleShowChange} className="block" checked={series.show} />
          <span>表示する</span>
        </label>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <TrashIcon size="medium" />
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex justify-center">系統の削除</DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-center text-foreground break-words max-w-md mx-auto">
                系統名「{series.name ?? defaultSeriesName(series)}」のグラフを削除しますか？
              </DialogDescription>
              <DialogFooter>
                <Button
                  className="transition-all mx-auto w-fit"
                  variant="destructive"
                  onClick={onRemoveClick}
                >
                  削除する
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
      <div>
        <span>系統名</span>
        <Input
          value={series.name ?? ""}
          onChange={handleNameChange}
          placeholder={defaultSeriesName(series)}
        />
      </div>
      <div>
        <span>設置場所</span>
        <Select onValueChange={handlePlacementChange} value={series.placement}>
          <SelectTrigger
            className={cn(
              `${series.placement !== undefined ? "text-foreground" : "text-gray-500"}`,
            )}
          >
            <SelectValue placeholder="選択して下さい" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PLACEMENTS).map(([placement, { text }]) => (
              <SelectItem key={placement} value={placement}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <span>検出対象</span>
        <Select
          key={series.placement}
          // 設置場所が未設定なら検出対象は選択できない
          disabled={!series.placement}
          value={series.objectClass}
          onValueChange={handleObjectClassChange}
        >
          <SelectTrigger
            className={cn(
              `${series.objectClass !== undefined ? "text-foreground" : "text-gray-500"}`,
            )}
          >
            <SelectValue placeholder="選択して下さい" />
          </SelectTrigger>
          <SelectContent>
            {series.placement
              ? PLACEMENTS[series.placement].targetObjects.map((objectClass) => (
                  <SelectItem value={objectClass} key={`${series.placement}#${objectClass}`}>
                    {OBJECT_CLASS[objectClass]}
                  </SelectItem>
                ))
              : null}
          </SelectContent>
        </Select>
      </div>
      {series.objectClass !== undefined && series.objectClass !== "Person" ? (
        <>
          <div>
            <span>グラフ種類</span>
            <RadioGroup
              value={tempGraphType}
              onValueChange={handleGraphTypeChange}
              className="mt-2 pl-2"
            >
              {Object.entries(GRAPH_TYPES).map(([graphType, graphTypeText]) => (
                <div key={graphType + "radio"}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={graphType} id={`${series.id}-${graphType}`} />
                    <Label htmlFor={`${series.id}-${graphType}`}>{graphTypeText}</Label>
                  </div>
                  {graphType !== "simple" &&
                  graphType === tempGraphType &&
                  series.objectClass !== undefined &&
                  series.objectClass !== "Person" ? (
                    <Select
                      key={graphType}
                      onValueChange={handleAttributeChange}
                      value={series.focusedAttribute}
                    >
                      <SelectTrigger
                        className={cn(
                          `${series.focusedAttribute !== undefined ? "text-foreground" : "text-gray-500"} mt-2`,
                        )}
                      >
                        <SelectValue placeholder={"属性を選択して下さい"} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(OBJECT_CLASS_ATTRIBUTES[series.objectClass]).map(
                          (objectClassAttribute) => (
                            <SelectItem key={objectClassAttribute} value={objectClassAttribute}>
                              {
                                JAPANESE_ATTRIBUTE_NAME[
                                  objectClassAttribute as ObjectClassAttribute
                                ]
                              }
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  ) : undefined}
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <span>フィルタ</span>
            {Object.entries(OBJECT_CLASS_ATTRIBUTES[series.objectClass]).map(
              ([objectClassAttribute, attributeValues]: [string, Record<string, string>]) => (
                <div className="mt-2 pl-2" key={objectClassAttribute}>
                  <span>
                    {JAPANESE_ATTRIBUTE_NAME[objectClassAttribute as ObjectClassAttribute]}
                  </span>
                  <div className="pl-2">
                    {objectClassAttribute === "prefectures" ? (
                      <PrefectureFilter
                        objectClassAttribute={objectClassAttribute as ObjectClassAttribute}
                        allPrefectureKeys={Object.keys(PREFECTURES)}
                        series={series}
                        notify={notify}
                        updateSeriesProperty={updateSeriesProperty}
                        attributeValues={attributeValues}
                      ></PrefectureFilter>
                    ) : (
                      <AttributeFilter
                        objectClassAttribute={objectClassAttribute as ObjectClassAttribute}
                        series={series}
                        notify={notify}
                        updateSeriesProperty={updateSeriesProperty}
                        attributeValues={attributeValues}
                      ></AttributeFilter>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </>
      ) : undefined}
    </Card>
  );
}
